<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class OwnedRecipes extends Controller
{
    // Sirve para listar las recetas adquiridas por el usuario autenticado
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            $recipes = DB::table('receta_adquirida')
                ->join('receta_original', 'receta_adquirida.id_receta', '=', 'receta_original.id_receta')
                ->where('receta_adquirida.id_usuario', $user->id_usuario)
                ->select('receta_original.*', 'receta_adquirida.fecha_compra')
                ->orderByDesc('receta_adquirida.fecha_compra')
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
                ->groupBy('id_receta');

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

            $result = $recipes->map(function ($recipe) use ($categorias, $valoraciones, $autores) {
                $recipe->categorias = $categorias->get($recipe->id_receta, collect())->values();
                $recipe->media_valoraciones = $valoraciones->get($recipe->id_receta)->media_valoraciones ?? null;
                $recipe->autor_nombre = $autores->get($recipe->id_autor)->nombre ?? null;
                $recipe->autor_icon_path = $autores->get($recipe->id_autor)->icon_path ?? null;
                $recipe->autor_updated_at = $autores->get($recipe->id_autor)->updated_at ?? null;
                $recipe->purchased = true;

                return $recipe;
            })->values();

            return response()->json($result);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not get owned recipes',
                'errors' => ['server' => [$e->getMessage()]],
            ], 500);
        }
    }
}
