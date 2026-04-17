<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    /**
     * Bridge between our App and n8n Chatbot Workflow
     */
    public function buscar(Request $request)
    {
        Log::info("CHATBOT_RESTORED_VERSION_TRIGGERED");
        $request->validate([
            'mensaje' => 'required|string',
        ]);

        $mensaje = $request->input('mensaje');

        try {
            // URL interna del webhook de n8n dentro de la red de Docker
            $n8nUrl = 'http://n8n:5678/webhook/api/chatbot/receta/buscar';

            Log::info("Enviando petición a n8n: " . $mensaje);

            $response = Http::timeout(30)->post($n8nUrl, [
                'mensaje' => $mensaje,
                'user_id' => auth('api')->id(),
            ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            Log::error("Error en respuesta de n8n: " . $response->status());
            return response()->json([
                'status' => 'error',
                'message' => 'El servidor de IA no respondió correctamente.'
            ], 500);

        } catch (\Exception $e) {
            Log::error("Error al conectar con n8n: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'No se pudo establecer conexión con el motor de IA. Detalle: ' . $e->getMessage()
            ], 500);
        }
    }
}
