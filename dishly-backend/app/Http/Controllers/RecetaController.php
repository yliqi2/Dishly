<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\RecetaOriginal;

class RecetaController extends Controller
{
    public function getCategorias()
    {
        $categorias = DB::table('categoria')->select('id_categoria', 'nombre')->get();
        return response()->json($categorias);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['required', 'string'],
            'instrucciones' => ['required', 'string'],
            'tiempo_preparacion' => ['required', 'integer', 'min:1'],
            'tiempo_preparacion_unidad' => ['required', Rule::in(['minutes', 'hours'])],
            'dificultad' => ['required', Rule::in(['easy', 'medium', 'hard'])],
            'porciones' => ['required', 'integer', 'min:1'],
            'price' => ['nullable', 'regex:/^\d+([\,\.]\d{1,2})?$/'],
            'imagenes' => ['nullable', 'array', 'max:5'],
            'imagenes.*' => ['string', 'max:2048'],
            'categorias' => ['nullable', 'array'],
            'categorias.*' => ['integer', 'exists:categoria,id_categoria', 'distinct'],
            'ingredientes' => ['nullable', 'array'],
            'ingredientes.*.id_ingrediente' => ['required', 'integer', 'exists:ingrediente,id_ingrediente', 'distinct'],
            'ingredientes.*.cantidad' => ['required', 'numeric', 'gt:0'],
        ]);

        $authorId = optional($request->user())->id_usuario ?? $request->input('id_autor');
        if (!$authorId) {
            return response()->json([
                'message' => 'Author is required.',
            ], 422);
        }

        $images = array_values($data['imagenes'] ?? []);
        $categories = $data['categorias'] ?? [];
        $ingredients = $data['ingredientes'] ?? [];

        $recipe = DB::transaction(function () use ($data, $authorId, $images, $categories, $ingredients) {
            $receta = new RecetaOriginal();
            $receta->titulo = $data['titulo'];
            $receta->descripcion = $data['descripcion'];
            $receta->instrucciones = $data['instrucciones'];
            $receta->tiempo_preparacion = $data['tiempo_preparacion'];
            $receta->tiempo_preparacion_unidad = $data['tiempo_preparacion_unidad'];
            $receta->dificultad = $data['dificultad'];
            $receta->porciones = $data['porciones'];
            $receta->price = isset($data['price'])
                ? str_replace(',', '.', $data['price'])
                : null;
            $receta->imagen_1 = $images[0] ?? null;
            $receta->imagen_2 = $images[1] ?? null;
            $receta->imagen_3 = $images[2] ?? null;
            $receta->imagen_4 = $images[3] ?? null;
            $receta->imagen_5 = $images[4] ?? null;
            $receta->fecha_creacion = now()->toDateString();
            $receta->id_autor = $authorId;
            $receta->save();

            if (!empty($categories)) {
                $categoriaRows = array_map(function ($idCategoria) use ($receta) {
                    return [
                        'id_receta' => $receta->id_receta,
                        'id_categoria' => $idCategoria,
                    ];
                }, $categories);

                DB::table('receta_categoria')->insert($categoriaRows);
            }

            if (!empty($ingredients)) {
                $ingredienteRows = array_map(function ($item) use ($receta) {
                    return [
                        'id_receta' => $receta->id_receta,
                        'id_ingrediente' => $item['id_ingrediente'],
                        'cantidad' => $item['cantidad'],
                    ];
                }, $ingredients);

                DB::table('receta_ingrediente')->insert($ingredienteRows);
            }

            return $receta;
        });

        return response()->json([
            'message' => 'Recipe created successfully.',
            'recipe' => $recipe,
            'categorias' => $categories,
            'ingredientes' => $ingredients,
        ], 201);
    }
}
