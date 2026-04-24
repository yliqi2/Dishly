<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Models\RecetaOriginal;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Throwable;

class RecetaController extends Controller
{
    public function getCategorias()
    {
        $categorias = DB::table('categoria')->select('id_categoria', 'nombre')->get();
        return response()->json($categorias);
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'titulo' => ['required', 'string', 'max:255'],
                'descripcion' => ['required', 'string'],
                'instrucciones' => ['required', 'string'],
                'tiempo_preparacion' => ['required', 'integer', 'min:1'],
                'tiempo_preparacion_unidad' => ['required', Rule::in(['minutes', 'hours'])],
                'dificultad' => ['required', Rule::in(['easy', 'medium', 'hard'])],
                'porciones' => ['required', 'integer', 'min:1'],
                'price' => ['nullable', 'regex:/^\d+([\,\.]\d{1,2})?$/'],
                'imagenes' => ['required', 'array', 'min:1', 'max:5'],
                'imagenes.*' => ['required', 'file', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:10240'],
                'categorias' => ['required', 'array', 'min:1'],
                'categorias.*' => ['integer', 'exists:categoria,id_categoria', 'distinct'],
                'ingredientes' => ['required', 'array', 'min:1'],
                'ingredientes.*.nombre' => ['required', 'string', 'max:255', 'distinct'],
                'ingredientes.*.cantidad' => ['required', 'numeric', 'gt:0'],
                'ingredientes.*.unidad' => ['required', Rule::in(['g', 'kg', 'mg', 'l', 'ml', 'unit'])],
            ]);

            $authorId = optional($request->user())->id_usuario ?? $request->input('id_autor');
            if (!$authorId) {
                return response()->json([
                    'message' => 'Author is required.',
                ], 422);
            }

            $categories = array_values($data['categorias'] ?? []);
            $ingredients = array_values($data['ingredientes'] ?? []);
            $imagePaths = $this->storeUploadedImages($request);

            $recipe = DB::transaction(function () use ($data, $authorId, $imagePaths, $categories, $ingredients) {
                $receta = new RecetaOriginal();
                $receta->titulo = trim((string) $data['titulo']);
                $receta->descripcion = trim((string) $data['descripcion']);
                $receta->instrucciones = trim((string) $data['instrucciones']);
                $receta->tiempo_preparacion = (int) $data['tiempo_preparacion'];
                $receta->tiempo_preparacion_unidad = $data['tiempo_preparacion_unidad'];
                $receta->dificultad = $data['dificultad'];
                $receta->porciones = (int) $data['porciones'];
                $receta->price = isset($data['price']) && $data['price'] !== ''
                    ? str_replace(',', '.', (string) $data['price'])
                    : null;
                $receta->imagen_1 = $imagePaths[0] ?? null;
                $receta->imagen_2 = $imagePaths[1] ?? null;
                $receta->imagen_3 = $imagePaths[2] ?? null;
                $receta->imagen_4 = $imagePaths[3] ?? null;
                $receta->imagen_5 = $imagePaths[4] ?? null;
                $receta->fecha_creacion = now()->toDateString();
                $receta->id_autor = $authorId;
                $receta->save();

                $categoriaRows = array_map(function ($idCategoria) use ($receta) {
                    return [
                        'id_receta' => $receta->id_receta,
                        'id_categoria' => (int) $idCategoria,
                    ];
                }, array_values(array_unique($categories)));
                DB::table('receta_categoria')->insert($categoriaRows);

                $rowsByIngredientId = [];
                foreach ($ingredients as $item) {
                    $ingredientName = trim((string) $item['nombre']);
                    $ingredientId = $this->resolveIngredientId($ingredientName);
                    $unit = $item['unidad'];
                    $qty = (float) $item['cantidad'];

                    if (isset($rowsByIngredientId[$ingredientId])) {
                        if ($rowsByIngredientId[$ingredientId]['unidad'] !== $unit) {
                            throw ValidationException::withMessages([
                                'ingredientes' => ['The same ingredient cannot use multiple units in one recipe.'],
                            ]);
                        }
                        $rowsByIngredientId[$ingredientId]['cantidad'] += $qty;
                        continue;
                    }

                    $rowsByIngredientId[$ingredientId] = [
                        'id_receta' => $receta->id_receta,
                        'id_ingrediente' => $ingredientId,
                        'cantidad' => $qty,
                        'unidad' => $unit,
                    ];
                }

                DB::table('receta_ingrediente')->insert(array_values($rowsByIngredientId));

                return $receta;
            });

            return response()->json([
                'message' => 'Recipe created successfully.',
                'recipe' => $recipe,
                'categorias' => $categories,
                'ingredientes' => $ingredients,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not create recipe',
                'errors' => [
                    'server' => [$e->getMessage()],
                ],
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $newImagePaths = [];

        try {
            $user = Auth::guard('api')->user();

            $recipe = DB::table('receta_original')
                ->where('id_receta', $id)
                ->where('active', 1)
                ->first();

            if (!$recipe) {
                return response()->json([
                    'message' => 'Recipe not found.',
                ], 404);
            }

            if (!$user || ((int) $recipe->id_autor !== (int) $user->id_usuario && $user->rol !== 'admin')) {
                return response()->json([
                    'message' => 'You are not allowed to edit this recipe.',
                ], 403);
            }

            $data = $request->validate([
                'titulo' => ['required', 'string', 'max:255'],
                'descripcion' => ['required', 'string'],
                'instrucciones' => ['required', 'string'],
                'tiempo_preparacion' => ['required', 'integer', 'min:1'],
                'tiempo_preparacion_unidad' => ['required', Rule::in(['minutes', 'hours'])],
                'dificultad' => ['required', Rule::in(['easy', 'medium', 'hard'])],
                'porciones' => ['required', 'integer', 'min:1'],
                'price' => ['nullable', 'regex:/^\d+([\,\.]\d{1,2})?$/'],
                'categorias' => ['required', 'array', 'min:1'],
                'categorias.*' => ['integer', 'exists:categoria,id_categoria', 'distinct'],
                'ingredientes' => ['required', 'array', 'min:1'],
                'ingredientes.*.nombre' => ['required', 'string', 'max:255', 'distinct'],
                'ingredientes.*.cantidad' => ['required', 'numeric', 'gt:0'],
                'ingredientes.*.unidad' => ['required', Rule::in(['g', 'kg', 'mg', 'l', 'ml', 'unit'])],
                'image_order' => ['required', 'array', 'min:1', 'max:5'],
                'image_order.*' => ['required', 'string'],
                'imagenes_nuevas' => ['nullable', 'array', 'max:5'],
                'imagenes_nuevas.*' => ['required', 'file', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:10240'],
            ]);

            $categories = array_values($data['categorias'] ?? []);
            $ingredients = array_values($data['ingredientes'] ?? []);
            $currentImagePaths = $this->extractRecipeImagePaths($recipe);
            $newImagePaths = $this->storeUploadedImages($request, 'imagenes_nuevas');
            $orderedImagePaths = $this->resolveUpdatedImageOrder(
                $data['image_order'],
                $currentImagePaths,
                $newImagePaths
            );

            DB::transaction(function () use ($recipe, $data, $categories, $ingredients, $orderedImagePaths) {
                DB::table('receta_original')
                    ->where('id_receta', $recipe->id_receta)
                    ->update([
                        'titulo' => trim((string) $data['titulo']),
                        'descripcion' => trim((string) $data['descripcion']),
                        'instrucciones' => trim((string) $data['instrucciones']),
                        'tiempo_preparacion' => (int) $data['tiempo_preparacion'],
                        'tiempo_preparacion_unidad' => $data['tiempo_preparacion_unidad'],
                        'dificultad' => $data['dificultad'],
                        'porciones' => (int) $data['porciones'],
                        'price' => isset($data['price']) && $data['price'] !== ''
                            ? str_replace(',', '.', (string) $data['price'])
                            : null,
                        'imagen_1' => $orderedImagePaths[0] ?? null,
                        'imagen_2' => $orderedImagePaths[1] ?? null,
                        'imagen_3' => $orderedImagePaths[2] ?? null,
                        'imagen_4' => $orderedImagePaths[3] ?? null,
                        'imagen_5' => $orderedImagePaths[4] ?? null,
                    ]);

                DB::table('receta_categoria')
                    ->where('id_receta', $recipe->id_receta)
                    ->delete();

                $categoriaRows = array_map(function ($idCategoria) use ($recipe) {
                    return [
                        'id_receta' => $recipe->id_receta,
                        'id_categoria' => (int) $idCategoria,
                    ];
                }, array_values(array_unique($categories)));

                DB::table('receta_categoria')->insert($categoriaRows);

                DB::table('receta_ingrediente')
                    ->where('id_receta', $recipe->id_receta)
                    ->delete();

                $rowsByIngredientId = [];
                foreach ($ingredients as $item) {
                    $ingredientName = trim((string) $item['nombre']);
                    $ingredientId = $this->resolveIngredientId($ingredientName);
                    $unit = $item['unidad'];
                    $qty = (float) $item['cantidad'];

                    if (isset($rowsByIngredientId[$ingredientId])) {
                        if ($rowsByIngredientId[$ingredientId]['unidad'] !== $unit) {
                            throw ValidationException::withMessages([
                                'ingredientes' => ['The same ingredient cannot use multiple units in one recipe.'],
                            ]);
                        }

                        $rowsByIngredientId[$ingredientId]['cantidad'] += $qty;
                        continue;
                    }

                    $rowsByIngredientId[$ingredientId] = [
                        'id_receta' => $recipe->id_receta,
                        'id_ingrediente' => $ingredientId,
                        'cantidad' => $qty,
                        'unidad' => $unit,
                    ];
                }

                DB::table('receta_ingrediente')->insert(array_values($rowsByIngredientId));
            });

            $this->deleteRemovedRecipeImages($currentImagePaths, $orderedImagePaths);

            return response()->json([
                'message' => 'Recipe updated successfully.',
                'id_receta' => (int) $recipe->id_receta,
            ]);
        } catch (ValidationException $e) {
            $this->deleteStoredImages($newImagePaths);

            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            $this->deleteStoredImages($newImagePaths);

            return response()->json([
                'message' => 'Could not update recipe',
                'errors' => [
                    'server' => [$e->getMessage()],
                ],
            ], 500);
        }
    }

    private function resolveIngredientId(string $name): int
    {
        $normalized = trim($name);
        if ($normalized === '') {
            throw ValidationException::withMessages([
                'ingredientes' => ['Ingredient name cannot be empty.'],
            ]);
        }

        $existing = DB::table('ingrediente')
            ->whereRaw('LOWER(nombre) = ?', [Str::lower($normalized)])
            ->value('id_ingrediente');

        if ($existing) {
            return (int) $existing;
        }

        return (int) DB::table('ingrediente')->insertGetId([
            'nombre' => $normalized,
        ]);
    }

    private function storeUploadedImages(Request $request, string $field = 'imagenes'): array
    {
        $files = $request->file($field, []);
        $storedPaths = [];
        $publicPath = public_path('recipes');

        if (!file_exists($publicPath)) {
            mkdir($publicPath, 0755, true);
        }

        foreach ($files as $index => $file) {
            $ext = strtolower((string) $file->getClientOriginalExtension());
            $filename = Str::lower(Str::random(20)) . '-' . (time() + $index + 1) . '.' . $ext;
            $file->move($publicPath, $filename);
            $storedPaths[] = 'recipes/' . $filename;
        }

        return $storedPaths;
    }

    private function extractRecipeImagePaths(object $recipe): array
    {
        return array_values(array_filter([
            $recipe->imagen_1 ?? null,
            $recipe->imagen_2 ?? null,
            $recipe->imagen_3 ?? null,
            $recipe->imagen_4 ?? null,
            $recipe->imagen_5 ?? null,
        ]));
    }

    private function resolveUpdatedImageOrder(array $imageOrder, array $currentImagePaths, array $newImagePaths): array
    {
        $resolved = [];
        $usedExisting = [];
        $usedNew = [];

        foreach ($imageOrder as $entry) {
            if (!is_string($entry)) {
                throw ValidationException::withMessages([
                    'image_order' => ['Invalid image order entry.'],
                ]);
            }

            if (str_starts_with($entry, 'existing:')) {
                $path = substr($entry, 9);

                if ($path === '' || !in_array($path, $currentImagePaths, true) || in_array($path, $usedExisting, true)) {
                    throw ValidationException::withMessages([
                        'image_order' => ['Invalid existing image reference.'],
                    ]);
                }

                $usedExisting[] = $path;
                $resolved[] = $path;
                continue;
            }

            if (str_starts_with($entry, 'new:')) {
                $index = (int) substr($entry, 4);

                if (!array_key_exists($index, $newImagePaths) || in_array($index, $usedNew, true)) {
                    throw ValidationException::withMessages([
                        'image_order' => ['Invalid uploaded image reference.'],
                    ]);
                }

                $usedNew[] = $index;
                $resolved[] = $newImagePaths[$index];
                continue;
            }

            throw ValidationException::withMessages([
                'image_order' => ['Unknown image order entry.'],
            ]);
        }

        if (count($resolved) === 0) {
            throw ValidationException::withMessages([
                'image_order' => ['At least one image is required.'],
            ]);
        }

        if (count($resolved) > 5) {
            throw ValidationException::withMessages([
                'image_order' => ['You can only keep up to 5 images.'],
            ]);
        }

        return array_values($resolved);
    }

    private function deleteRemovedRecipeImages(array $currentImagePaths, array $finalImagePaths): void
    {
        $removedPaths = array_diff($currentImagePaths, $finalImagePaths);
        $this->deleteStoredImages($removedPaths);
    }

    private function deleteStoredImages(array $paths): void
    {
        foreach ($paths as $path) {
            if (!is_string($path) || trim($path) === '') {
                continue;
            }

            $absolutePath = public_path($path);
            if (file_exists($absolutePath)) {
                File::delete($absolutePath);
            }
        }
    }

    public function getMyRecipes()
    {
        try {
            $user = Auth::guard('api')->user();
            
            $recipes = DB::table('receta_original')
                    ->where('id_autor', $user->id_usuario)
                    ->where('active', 1)
                    ->orderByDesc('fecha_creacion')
                    ->get();
            
            if ($recipes->isEmpty()) {
                return response()->json([]);
            }

            $recipeIds = $recipes->pluck('id_receta')->toArray();

            $categorias = DB::table('receta_categoria')
                ->join('categoria', 'receta_categoria.id_categoria', '=', 'categoria.id_categoria')
                ->whereIn('receta_categoria.id_receta', $recipeIds)
                ->select('receta_categoria.id_receta', 'categoria.id_categoria', 'categoria.nombre')
                ->get()
                ->groupBy('id_receta');

            $ingredientes = DB::table('receta_ingrediente')
                ->join('ingrediente', 'receta_ingrediente.id_ingrediente', '=', 'ingrediente.id_ingrediente')
                ->whereIn('receta_ingrediente.id_receta', $recipeIds)
                ->select(
                    'receta_ingrediente.id_receta',
                    'ingrediente.id_ingrediente',
                    'ingrediente.nombre',
                    'receta_ingrediente.cantidad',
                    'receta_ingrediente.unidad'
                )
                ->get()
                ->groupBy('id_receta');

            $valoraciones = DB::table('valoracion')
                ->whereIn('id_receta', $recipeIds)
                ->select('id_receta', DB::raw('AVG(puntuacion) as media_valoraciones'))
                ->groupBy('id_receta')
                ->get()
                ->keyBy('id_receta');

            foreach ($recipes as $recipe) {
                $recipe->categorias = $categorias->get($recipe->id_receta, []);
                $recipe->ingredientes = $ingredientes->get($recipe->id_receta, []);
                $recipe->media_valoraciones = $valoraciones->get($recipe->id_receta)->media_valoraciones ?? null;
                $recipe->autor_nombre = $user->nombre;
            }

            $sortedRecipes = $recipes->sortByDesc('fecha_creacion')->values();

            return response()->json($sortedRecipes);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not get recipes',
                'errors' => [
                    $e->getMessage(),
                ],
            ], 500);
        }
    }

    public function getCountRecipes()
    {
        try {
            $user = Auth::guard('api')->user();
            
            $count = DB::table('receta_original')
                    ->where('id_autor', $user->id_usuario)
                    ->where('active', 1)
                    ->count();
            
            return response()->json($count);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not get count of recipes',
                'errors' => [
                    $e->getMessage(),
                ],
            ], 500);
        }
    } 
    
        public function getAllRecetas()
    {
        try {
            $recipes = DB::table('receta_original')
                ->where('active', 1)
                ->orderByDesc('fecha_creacion')
                ->get();
            
            if ($recipes->isEmpty()) {
                return response()->json([]);
            }

            $recipeIds = $recipes->pluck('id_receta')->toArray();
            $authorIds = $recipes->pluck('id_autor')->unique()->toArray();

            $categorias = DB::table('receta_categoria')
                ->join('categoria', 'receta_categoria.id_categoria', '=', 'categoria.id_categoria')
                ->whereIn('receta_categoria.id_receta', $recipeIds)
                ->select('receta_categoria.id_receta', 'categoria.id_categoria', 'categoria.nombre')
                ->get()
                ->groupBy('id_receta')
                ->map(function ($items) {
                    return $items->values()->toArray();
                });

            $valoraciones = DB::table('valoracion')
                ->whereIn('id_receta', $recipeIds)
                ->select('id_receta', DB::raw('AVG(puntuacion) as media_valoraciones'))
                ->groupBy('id_receta')
                ->get()
                ->keyBy('id_receta');

            $autores = DB::table('users')
                ->whereIn('id_usuario', $authorIds)
                ->select('id_usuario', 'nombre', 'icon_path', 'updated_at')
                ->get()
                ->keyBy('id_usuario');

            $recetasConDatos = $recipes->map(function ($receta) use ($categorias, $valoraciones, $autores) {
                $receta->categorias = $categorias[$receta->id_receta] ?? [];
                $receta->media_valoraciones = $valoraciones[$receta->id_receta]->media_valoraciones ?? null;
                $receta->autor_nombre = $autores[$receta->id_autor]->nombre ?? null;
                $receta->autor_icon_path = $autores[$receta->id_autor]->icon_path ?? null;
                $receta->autor_updated_at = $autores[$receta->id_autor]->updated_at ?? null;
                return $receta;
            });

            $sortedRecetas = $recetasConDatos->sortByDesc('fecha_creacion')->values();

            return response()->json($sortedRecetas);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not get recipes',
                'errors' => [
                    'server' => [$e->getMessage()],
                ],
            ], 500);
        }
    }

    public function getRecetaById($id)
    {
        try {
            $recipe = DB::table('receta_original')
                ->where('id_receta', $id)
                ->where('active', 1)
                ->first();
            
            if (!$recipe) {
                return response()->json(['message' => 'Recipe not found'], 404);
            }

            $categorias = DB::table('receta_categoria')
                ->join('categoria', 'receta_categoria.id_categoria', '=', 'categoria.id_categoria')
                ->where('receta_categoria.id_receta', $id)
                ->select('categoria.id_categoria', 'categoria.nombre')
                ->get();

            $ingredientes = DB::table('receta_ingrediente')
                ->join('ingrediente', 'receta_ingrediente.id_ingrediente', '=', 'ingrediente.id_ingrediente')
                ->where('receta_ingrediente.id_receta', $id)
                ->select(
                    'ingrediente.id_ingrediente',
                    'ingrediente.nombre',
                    'receta_ingrediente.cantidad',
                    'receta_ingrediente.unidad'
                )
                ->get();

            $valoracion = DB::table('valoracion')
                ->where('id_receta', $id)
                ->avg('puntuacion');

            $autor = DB::table('users')
                ->where('id_usuario', $recipe->id_autor)
                ->select('nombre', 'icon_path', 'updated_at')
                ->first();

            $recipe->categorias = $categorias;
            $recipe->ingredientes = $ingredientes;
            $recipe->media_valoraciones = $valoracion !== null ? round((float) $valoracion, 2) : 0;
            $recipe->autor_nombre = $autor?->nombre;
            $recipe->autor_icon_path = $autor?->icon_path;
            $recipe->autor_updated_at = $autor?->updated_at;

            return response()->json($recipe);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not get recipe',
                'errors' => [
                    'server' => [$e->getMessage()],
                ],
            ], 500);
        }
    }

    public function getValoraciones()
    {
        try {
            $user = Auth::guard('api')->user();
            
            $valoraciones = DB::table('valoracion')
                    ->join('receta_original', 'valoracion.id_receta', '=', 'receta_original.id_receta')
                    ->where('valoracion.id_usuario', $user->id_usuario)
                    ->where('receta_original.active', 1)
                    ->select(
                        'valoracion.*', 
                        'receta_original.titulo as receta_titulo', 
                        'receta_original.imagen_1 as receta_imagen'
                    )
                    ->orderBy('valoracion.fecha', 'desc')
                    ->get();
            
            if ($valoraciones->isEmpty()) {
                return response()->json([]);
            }

            return response()->json($valoraciones);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not get valoraciones',
                'errors' => [
                    $e->getMessage(),
                ],
            ], 500);
        }
    }

    public function getMediaValoraciones()
    {
        try {
            $user = Auth::guard('api')->user();

            $media = DB::table('valoracion')
                ->join('receta_original', 'valoracion.id_receta', '=', 'receta_original.id_receta')
                ->where('receta_original.id_autor', $user->id_usuario)
                ->where('receta_original.active', 1)
                ->avg('valoracion.puntuacion');

            return response()->json(['media' => $media !== null ? round((float) $media, 2) : null]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not get media de valoraciones',
                'errors' => [
                    $e->getMessage(),
                ],
            ], 500);
        }
    }

    public function setValoracion(Request $request)
    {
        try {
            $user = Auth::guard('api')->user();

            $data = $request->validate([
                'id_receta'  => ['required', 'integer', 'exists:receta_original,id_receta'],
                'puntuacion' => ['required', 'integer', 'min:1', 'max:5'],
                'comentario' => ['nullable', 'string', 'max:1000'],
            ]);

            $receta = DB::table('receta_original')
                ->where('id_receta', $data['id_receta'])
                ->where('active', 1)
                ->first();

            if (!$receta) {
                return response()->json([
                    'message' => 'La receta no existe o no está disponible.',
                ], 404);
            }

            if ($receta->id_autor == $user->id_usuario) {
                return response()->json([
                    'message' => 'No puedes valorar tu propia receta.',
                ], 403);
            }

            DB::table('valoracion')->updateOrInsert(
                [
                    'id_receta'  => $data['id_receta'],
                    'id_usuario' => $user->id_usuario,
                ],
                [
                    'puntuacion' => $data['puntuacion'],
                    'comentario' => $data['comentario'] ?? null,
                    'fecha'      => now()->toDateString(),
                ]
            );

            return response()->json(['message' => 'Valoración guardada correctamente.']);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not save valoración',
                'errors'  => [$e->getMessage()],
            ], 500);
        }
    }

    public function desactivarReceta($id)
    {
        try {
            $user = Auth::guard('api')->user();

            $query = DB::table('receta_original')
                ->where('id_receta', $id)
                ->where('active', 1);

            if ($user->rol !== 'admin') {
                $query->where('id_autor', $user->id_usuario);
            }

            $affected = $query->update(['active' => false]);

            if ($affected === 0) {
                return response()->json([
                    'message' => 'La receta no existe, no eres el autor, o ya está desactivada.',
                ], 404);
            }

            return response()->json([
                'message' => 'Receta desactivada correctamente.',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error al desactivar la receta',
                'errors' => [
                    'server' => [$e->getMessage()],
                ],
            ], 500);
        }
    }

    public function getReviewsForRecipe($id)
    {
        try {
            $valoraciones = DB::table('valoracion')
                ->join('users', 'valoracion.id_usuario', '=', 'users.id_usuario')
                ->where('valoracion.id_receta', $id)
                ->select(
                    'valoracion.*',
                    'users.nombre as autor_nombre',
                    'users.icon_path as autor_icon_path',
                    'users.updated_at as autor_updated_at'
                )
                ->orderByDesc('valoracion.fecha')
                ->get();

            return response()->json($valoraciones);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not get reviews',
                'errors' => [$e->getMessage()],
            ], 500);
        }
    }

    public function deleteValoracion($id)
    {
        try {
            $user = Auth::guard('api')->user();

            $val = DB::table('valoracion')
                ->where('id_valoracion', $id)
                ->first();

            if (!$val) {
                return response()->json([
                    'message' => 'Review no encontrada.',
                ], 404);
            }

            if ((int) $val->id_usuario !== (int) $user->id_usuario && $user->rol !== 'admin') {
                return response()->json([
                    'message' => 'No puedes eliminar una review que no es tuya.',
                ], 403);
            }

            DB::table('valoracion')
                ->where('id_valoracion', $id)
                ->delete();

            return response()->json(['message' => 'Review eliminada correctamente.']);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error al eliminar la review',
                'errors' => [$e->getMessage()],
            ], 500);
        }
    }

    public function checkPurchase($id)
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json(['purchased' => false]);
            }

            $recipe = DB::table('receta_original')
                ->where('id_receta', $id)
                ->where('active', 1)
                ->first();

            if (!$recipe) {
                return response()->json(['message' => 'Recipe not found'], 404);
            }

            // The author always has access
            if ((int) $recipe->id_autor === (int) $user->id_usuario) {
                return response()->json(['purchased' => true]);
            }

            // Free recipes are accessible to everyone
            if ($recipe->price === null || (float) $recipe->price <= 0) {
                return response()->json(['purchased' => true]);
            }

            $purchased = DB::table('receta_adquirida')
                ->where('id_usuario', $user->id_usuario)
                ->where('id_receta', $id)
                ->exists();

            return response()->json(['purchased' => $purchased]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not check purchase status',
                'errors' => [$e->getMessage()],
            ], 500);
        }
    }
}
