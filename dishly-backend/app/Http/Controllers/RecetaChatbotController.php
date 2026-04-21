<?php
// app/Http/Controllers/RecetaChatbotController.php

namespace App\Http\Controllers;

use App\Models\RecetaOriginal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecetaChatbotController extends Controller
{
    protected $n8nWebhookUrl = 'http://localhost:5678/webhook/api/chatbot/receta';

    /**
     * Buscar receta por mensaje natural usando IA
     */
    public function buscarReceta(Request $request)
    {
        $request->validate([
            'mensaje' => 'required|string|min:3|max:500',
            'user_id' => 'nullable|integer|exists:users,id_usuario'
        ]);

        try {
            // Llamar a n8n
            $response = Http::timeout(35)->post(config('services.n8n.chatbot_recipe_url', $this->n8nWebhookUrl), [
                'mensaje' => $request->mensaje,
                'user_id' => $request->user_id ?? auth()->id(),
                'timestamp' => now()->toISOString()
            ]);

            if (!$response->successful()) {
                Log::error('Error en n8n', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Error en el servicio de recetas'
                ], 500);
            }

            $data = $response->json();

            if (($data['status'] ?? null) === 'success') {
                return response()->json([
                    'status' => 'success',
                    'receta' => $data['receta']
                ]);
            }

            return response()->json([
                'status' => 'not_found',
                'message' => $data['message'] ?? 'No se encontró ninguna receta'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Excepción en chatbot recetas', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error de conexión con el asistente culinario'
            ], 500);
        }
    }

    /**
     * Obtener receta por ID directamente (sin IA)
     */
    public function getRecetaById($id)
    {
        $receta = RecetaOriginal::with(['ingredientes', 'autor'])
            ->active()
            ->find($id);

        if (!$receta) {
            return response()->json([
                'status' => 'error',
                'message' => 'Receta no encontrada'
            ], 404);
        }

        $dificultadMap = [
            'easy' => 'Fácil',
            'medium' => 'Media',
            'hard' => 'Difícil'
        ];

        $unidadTiempoMap = [
            'minutes' => 'minutos',
            'hours' => 'horas'
        ];

        $unidadIngredienteMap = [
            'g' => 'gramos',
            'kg' => 'kilos',
            'mg' => 'miligramos',
            'l' => 'litros',
            'ml' => 'mililitros',
            'unit' => 'unidades'
        ];

        return response()->json([
            'status' => 'success',
            'receta' => [
                'id_receta' => $receta->id_receta,
                'titulo' => $receta->titulo,
                'descripcion' => $receta->descripcion,
                'instrucciones' => $receta->instrucciones,
                'tiempo_preparacion' => $receta->tiempo_preparacion,
                'tiempo_preparacion_unidad' => $receta->tiempo_preparacion_unidad,
                'tiempo_texto' => "{$receta->tiempo_preparacion} " . ($unidadTiempoMap[$receta->tiempo_preparacion_unidad] ?? $receta->tiempo_preparacion_unidad),
                'dificultad' => $receta->dificultad,
                'dificultad_texto' => $dificultadMap[$receta->dificultad] ?? $receta->dificultad,
                'porciones' => $receta->porciones,
                'price' => $receta->price,
                'ingredientes' => $receta->ingredientes->map(function($ingrediente) use ($unidadIngredienteMap) {
                    return [
                        'nombre' => $ingrediente->nombre,
                        'cantidad' => $ingrediente->pivot->cantidad,
                        'unidad' => $ingrediente->pivot->unidad,
                        'unidad_texto' => $unidadIngredienteMap[$ingrediente->pivot->unidad] ?? $ingrediente->pivot->unidad
                    ];
                }),
                'imagenes' => $receta->imagenes,
                'imagen_principal' => $receta->imagenes[0] ?? null,
                'autor' => $receta->autor->nombre ?? 'Anónimo',
                'fecha_creacion' => $receta->fecha_creacion
            ]
        ]);
    }
}
