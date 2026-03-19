<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Models\RecetaOriginal;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
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
                'ingredientes.*.unidad' => ['required', Rule::in(['g', 'kg', 'mg', 'l', 'ml'])],
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

    private function storeUploadedImages(Request $request): array
    {
        $files = $request->file('imagenes', []);
        $storedPaths = [];
        $publicPath = public_path('recipes');

        if (!file_exists($publicPath)) {
            mkdir($publicPath, 0755, true);
        }

        foreach ($files as $file) {
            $ext = strtolower((string) $file->getClientOriginalExtension());
            $filename = Str::lower(Str::random(24)) . '.' . $ext;
            $file->move($publicPath, $filename);
            $storedPaths[] = 'recipes/' . $filename;
        }

        return $storedPaths;
    }

    public function getMyRecipes()
    {
        try {
            $user = Auth::guard('api')->user();
            
            $recipes = DB::table('receta_original')
                    ->where('id_autor', $user->id_usuario)
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

            foreach ($recipes as $recipe) {
                $recipe->categorias = $categorias->get($recipe->id_receta, []);
                $recipe->ingredientes = $ingredientes->get($recipe->id_receta, []);
                $recipe->autor_nombre = $user->nombre;
            }

            return response()->json($recipes);
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

    public function getValoraciones()
    {
        try {
            $user = Auth::guard('api')->user();
            
            $valoraciones = DB::table('valoracion')
                    ->join('receta_original', 'valoracion.id_receta', '=', 'receta_original.id_receta')
                    ->where('valoracion.id_usuario', $user->id_usuario)
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
}
