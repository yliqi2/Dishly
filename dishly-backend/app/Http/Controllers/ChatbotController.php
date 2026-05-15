<?php

namespace App\Http\Controllers;

use App\Models\RecetaOriginal;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class ChatbotController extends Controller
{
    private const N8N_CONNECT_TIMEOUT_SECONDS = 2;
    private const N8N_TIMEOUT_SECONDS = 6;
    private const MINIMUM_FALLBACK_SCORE = 20;
    private const RECIPE_INTENT_KEYWORDS = [
        'receta', 'recetas', 'cocinar', 'cena', 'comida', 'desayuno', 'almuerzo', 'merienda', 'postre',
        'pasta', 'hamburguesa', 'burger', 'pollo', 'carne', 'vegetariana', 'vegetariano', 'ingrediente',
        'ingredientes', 'plato', 'platos', 'horno', 'freir', 'asar', 'pescado', 'arroz', 'ensalada',
        'recipe', 'recipes', 'cook', 'cooking', 'dinner', 'lunch', 'breakfast', 'dessert', 'ingredient',
        'ingredients', 'dish', 'meal', 'chicken', 'beef', 'pasta', 'salad', 'rice', 'vegetarian',
    ];

    private const DEFAULT_N8N_URLS = [
        'http://n8n:5678/webhook/api/chatbot/receta/buscar',
        'http://localhost:5678/webhook/api/chatbot/receta/buscar',
    ];

    private const STOP_WORDS = [
        'que', 'quiero', 'puedo', 'pueda', 'hacer', 'cocinar', 'con', 'para', 'una', 'uno', 'unos', 'unas',
        'de', 'del', 'la', 'las', 'el', 'los', 'algo', 'receta', 'recetas', 'plato', 'platos', 'comida',
        'quiera', 'gustaria', 'busco', 'buscar', 'dame', 'necesito', 'tengo', 'hay', 'por', 'favor',
    ];

    private const TERM_SYNONYMS = [
        'hamburguesa' => ['burger', 'smash', 'beef', 'brioche', 'cheddar', 'bacon'],
        'hamburguesas' => ['burger', 'smash', 'beef', 'brioche', 'cheddar', 'bacon'],
        'burger' => ['burger', 'smash', 'beef', 'brioche', 'cheddar', 'bacon'],
        'hamburger' => ['burger', 'smash', 'beef', 'brioche', 'cheddar', 'bacon'],
        'pollo' => ['chicken', 'poultry'],
        'ternera' => ['beef'],
        'carne' => ['beef', 'meat'],
        'pasta' => ['pasta', 'spaghetti', 'fettuccine'],
        'espagueti' => ['spaghetti', 'pasta'],
        'espaguetis' => ['spaghetti', 'pasta'],
        'fetuccine' => ['fettuccine', 'pasta'],
        'queso' => ['cheese', 'parmesan', 'cheddar'],
        'tomate' => ['tomato', 'tomatoes'],
        'tocino' => ['bacon'],
        'aguacate' => ['avocado', 'guacamole'],
        'rapida' => ['quick'],
        'rapido' => ['quick'],
        'facil' => ['easy'],
        'italiana' => ['italian'],
        'italiano' => ['italian'],
    ];

    // Sirve para buscar o generar una respuesta de receta según el mensaje del usuario
    public function buscar(Request $request): JsonResponse
    {
        try {
            $mensaje = $this->extractMessage($request);
            $userId = $request->user('api')?->id_usuario;

            if ($conversationReply = $this->buildConversationalReply($mensaje)) {
                return response()->json($conversationReply);
            }

            $n8nResponse = $this->requestN8n($mensaje, $userId);
            if ($n8nResponse !== null) {
                return response()->json($n8nResponse);
            }

            return $this->fallbackResponse($mensaje);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->validator->errors()->first('mensaje') ?: 'The message field is required.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            $this->safeLog('error', 'Chatbot: error no controlado al procesar la petición', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'The culinary assistant is temporarily unavailable. Please try again in a few seconds.',
            ], 503);
        }
    }

    // Sirve para devolver el catálogo de recetas disponible para el chatbot
    public function catalog()
    {
        $recipes = RecetaOriginal::with(['ingredientes', 'autor'])
            ->active()
            ->orderByDesc('fecha_creacion')
            ->get()
            ->map(function (RecetaOriginal $recipe) {
                $ingredientRows = $recipe->ingredientes->map(function ($ingredient) {
                    return sprintf(
                        '%s (%s %s)',
                        $ingredient->nombre,
                        rtrim(rtrim((string) $ingredient->pivot->cantidad, '0'), '.'),
                        $ingredient->pivot->unidad
                    );
                })->values();

                return [
                    'id_receta' => (int) $recipe->id_receta,
                    'titulo' => $recipe->titulo,
                    'descripcion' => $recipe->descripcion,
                    'instrucciones' => $recipe->instrucciones,
                    'tiempo_preparacion' => (int) $recipe->tiempo_preparacion,
                    'tiempo_preparacion_unidad' => $recipe->tiempo_preparacion_unidad,
                    'dificultad' => $recipe->dificultad,
                    'porciones' => (int) $recipe->porciones,
                    'price' => $recipe->price,
                    'imagen_1' => $recipe->imagen_1,
                    'imagen_2' => $recipe->imagen_2,
                    'imagen_3' => $recipe->imagen_3,
                    'imagen_4' => $recipe->imagen_4,
                    'imagen_5' => $recipe->imagen_5,
                    'fecha_creacion' => $recipe->fecha_creacion,
                    'autor_nombre' => $recipe->autor?->nombre ?? 'Anónimo',
                    'ingredientes_completos' => $ingredientRows->implode('|'),
                    'solo_ingredientes' => $recipe->ingredientes->pluck('nombre')->implode(', '),
                ];
            })
            ->values();

        return response()->json($recipes);
    }

    // Sirve para enviar el mensaje al workflow de n8n y obtener la respuesta
    private function requestN8n(string $mensaje, ?int $userId): ?array
    {
        foreach ($this->getN8nUrls() as $n8nUrl) {
            try {
                $this->safeLog('info', 'Chatbot: enviando petición a n8n', [
                    'url' => $n8nUrl,
                    'mensaje' => $mensaje,
                ]);

                $response = Http::acceptJson()
                    ->connectTimeout(self::N8N_CONNECT_TIMEOUT_SECONDS)
                    ->timeout(self::N8N_TIMEOUT_SECONDS)
                    ->post($n8nUrl, [
                    'mensaje' => $mensaje,
                    'user_id' => $userId,
                ]);

                if (!$response->successful()) {
                    $this->safeLog('warning', 'Chatbot: n8n devolvió un estado no válido', [
                        'url' => $n8nUrl,
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                    continue;
                }

                $payload = $response->json();
                if (!is_array($payload)) {
                    $this->safeLog('warning', 'Chatbot: n8n devolvió un payload no válido', [
                        'url' => $n8nUrl,
                    ]);
                    continue;
                }

                if (($payload['status'] ?? null) !== 'success' || !is_array($payload['receta'] ?? null)) {
                    $this->safeLog('warning', 'Chatbot: n8n respondió sin una receta válida, se usará fallback local', [
                        'url' => $n8nUrl,
                        'payload' => $payload,
                    ]);
                    continue;
                }

                $recipeId = $payload['receta']['id_receta'] ?? null;
                if (!$recipeId) {
                    $this->safeLog('warning', 'Chatbot: n8n devolvió success sin id_receta', [
                        'url' => $n8nUrl,
                        'payload' => $payload,
                    ]);
                    continue;
                }

                $recipe = RecetaOriginal::with(['ingredientes', 'autor'])
                    ->active()
                    ->find($recipeId);

                if ($recipe === null) {
                    $this->safeLog('warning', 'Chatbot: receta devuelta por n8n no existe en Laravel', [
                        'url' => $n8nUrl,
                        'recipe_id' => $recipeId,
                    ]);
                    continue;
                }

                return [
                    'status' => 'success',
                    'source' => 'n8n',
                    'receta' => $this->formatRecipe(
                        $recipe,
                        $mensaje,
                        $payload['receta']['mensaje_chat'] ?? null
                    ),
                ];
            } catch (Throwable $e) {
                $this->safeLog('warning', 'Chatbot: error al conectar con n8n', [
                    'url' => $n8nUrl,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return null;
    }

    // Sirve para responder cuando n8n no está disponible
    private function fallbackResponse(string $mensaje)
    {
        $fallbackRecipe = $this->findRecipeFallback($mensaje);
        if ($fallbackRecipe === null) {
            return response()->json([
                'status' => 'success',
                'source' => 'laravel-conversation',
                'message' => $this->buildNoMatchReply($mensaje),
                'receta' => null,
            ]);
        }

        return response()->json([
            'status' => 'success',
            'source' => 'laravel-fallback',
            'receta' => $this->formatRecipe($fallbackRecipe, $mensaje),
        ]);
    }

    // Sirve para obtener las URLs configuradas de n8n
    private function getN8nUrls(): array
    {
        $configuredUrl = config('services.n8n.chatbot_recipe_url');
        $urls = [];

        if (is_string($configuredUrl) && trim($configuredUrl) !== '') {
            $urls[] = trim($configuredUrl);
        }

        return array_values(array_unique(array_merge($urls, self::DEFAULT_N8N_URLS)));
    }

    // Sirve para extraer el mensaje del usuario de la petición
    private function extractMessage(Request $request): string
    {
        $mensaje = $request->input('mensaje');

        if (!is_string($mensaje) || trim($mensaje) === '') {
            $jsonPayload = $request->json()->all();
            $jsonMessage = $jsonPayload['mensaje'] ?? null;

            if (is_string($jsonMessage)) {
                $mensaje = $jsonMessage;
            }
        }

        $mensaje = trim((string) $mensaje);

        if ($mensaje === '' || mb_strlen($mensaje) < 2 || mb_strlen($mensaje) > 500) {
            throw ValidationException::withMessages([
                'mensaje' => ['The message field is required and must be between 2 and 500 characters.'],
            ]);
        }

        return $mensaje;
    }

    // Sirve para registrar logs del chatbot sin romper el flujo
    private function safeLog(string $level, string $message, array $context = []): void
    {
        try {
            Log::log($level, $message, $context);
        } catch (Throwable) {
        }
    }

    // Sirve para buscar una receta en base de datos como respaldo
    private function findRecipeFallback(string $mensaje): ?RecetaOriginal
    {
        $recipes = RecetaOriginal::with(['ingredientes', 'autor'])
            ->active()
            ->get();

        if ($recipes->isEmpty()) {
            return null;
        }

        $tokens = $this->tokenize($mensaje);
        $bestRecipe = null;
        $bestScore = 0;

        foreach ($recipes as $recipe) {
            $title = $this->normalizeText($recipe->titulo);
            $description = $this->normalizeText($recipe->descripcion);
            $instructions = $this->normalizeText($recipe->instrucciones);
            $ingredients = $this->normalizeText($recipe->ingredientes->pluck('nombre')->implode(' '));
            $haystack = implode(' ', [$title, $description, $instructions, $ingredients]);

            $score = 0;
            foreach ($tokens as $token) {
                if (str_contains($title, $token)) {
                    $score += 30;
                }
                if (str_contains($ingredients, $token)) {
                    $score += 18;
                }
                if (str_contains($description, $token)) {
                    $score += 10;
                }
                if (str_contains($instructions, $token)) {
                    $score += 6;
                }
            }

            if ($this->containsAny($tokens, ['burger', 'smash', 'beef']) && !str_contains($haystack, 'burger') && !str_contains($haystack, 'smash')) {
                $score -= 20;
            }

            if ($this->containsAny($tokens, ['pasta', 'spaghetti', 'fettuccine']) && !str_contains($haystack, 'pasta') && !str_contains($haystack, 'spaghetti') && !str_contains($haystack, 'fettuccine')) {
                $score -= 20;
            }

            if ($this->containsAny($tokens, ['chicken', 'poultry']) && !str_contains($haystack, 'chicken')) {
                $score -= 25;
            }

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestRecipe = $recipe;
            }
        }

        return $bestScore >= self::MINIMUM_FALLBACK_SCORE ? $bestRecipe : null;
    }

    // Sirve para dividir el mensaje en tokens para la búsqueda
    private function tokenize(string $message): array
    {
        $normalized = $this->normalizeText($message);
        $rawTokens = preg_split('/[^a-z0-9]+/', $normalized) ?: [];
        $tokens = [];

        foreach ($rawTokens as $rawToken) {
            $token = trim($rawToken);
            if (strlen($token) < 3 || in_array($token, self::STOP_WORDS, true)) {
                continue;
            }

            $tokens[] = $token;

            foreach (self::TERM_SYNONYMS[$token] ?? [] as $synonym) {
                $tokens[] = $synonym;
            }
        }

        return array_values(array_unique($tokens));
    }

    // Sirve para comprobar si algún token coincide con las palabras clave
    private function containsAny(array $tokens, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (in_array($needle, $tokens, true)) {
                return true;
            }
        }

        return false;
    }

    // Sirve para construir una respuesta conversacional sin receta
    private function buildConversationalReply(string $mensaje): ?array
    {
        $normalizedMessage = $this->normalizeText($mensaje);

        if (preg_match('/\b(hola|buenas|hey|ey|hello|hi)\b/u', $normalizedMessage)) {
            return [
                'status' => 'success',
                'source' => 'laravel-conversation',
                'message' => 'Hello. I am Dishly AI, and I can help you decide what to cook, suggest recipe ideas, or adapt a dish to what you already have at home. If you want, tell me an ingredient, a craving, or how much time you have.',
                'receta' => null,
            ];
        }

        if (preg_match('/\b(gracias|muchas gracias|genial|perfecto|thanks|thank you)\b/u', $normalizedMessage)) {
            return [
                'status' => 'success',
                'source' => 'laravel-conversation',
                'message' => 'You are welcome. If you want, I can continue with another idea, suggest a similar option, or adapt it into something quicker, easier, or more budget-friendly.',
                'receta' => null,
            ];
        }

        if (preg_match('/\b(que puedes hacer|como funcionas|ayuda|help|quien eres|que eres|puedes conversar|podemos hablar|what can you do|how do you work|who are you|can you chat|can we talk)\b/u', $normalizedMessage)) {
            return [
                'status' => 'success',
                'source' => 'laravel-conversation',
                'message' => 'I can keep a short conversation going about cooking and also suggest real Dishly recipes. For example: "I want something creamy for dinner", "I have tomato and cheese", or "give me an easy recipe in 20 minutes".',
                'receta' => null,
            ];
        }

        if (preg_match('/\b(como estas|que tal|todo bien|how are you|how is it going|how are things)\b/u', $normalizedMessage)) {
            return [
                'status' => 'success',
                'source' => 'laravel-conversation',
                'message' => 'I am ready to talk about food. If you want, we can start with something specific: an ingredient, a dish style, or the amount of time you want to spend cooking.',
                'receta' => null,
            ];
        }

        if (preg_match('/\b(tell me something|surprise me|give me an idea|i do not know what to cook|suggest something)\b/u', $normalizedMessage)) {
            return [
                'status' => 'success',
                'source' => 'laravel-conversation',
                'message' => 'Sure. Give me one of these and I will turn it into a better suggestion: a main ingredient, the mood you are in, how much time you have, or whether you want something light, cozy, or indulgent.',
                'receta' => null,
            ];
        }

        return null;
    }

    // Sirve para generar el mensaje cuando no hay receta coincidente
    private function buildNoMatchReply(string $mensaje): string
    {
        if ($this->looksLikeRecipeIntent($mensaje)) {
            return 'I do not have a precise match for that yet, but I can still help. Try telling me the main ingredient, the style of dish you want, or how much time you have, and I will suggest something closer.';
        }

        return 'Of course. I am here to chat about food and cooking too. Ask me for an idea, tell me what ingredients you have, or describe what you feel like eating and I will help you shape it.';
    }

    // Sirve para detectar si el usuario pide una receta
    private function looksLikeRecipeIntent(string $mensaje): bool
    {
        $normalizedMessage = $this->normalizeText($mensaje);

        foreach (self::RECIPE_INTENT_KEYWORDS as $keyword) {
            if (str_contains($normalizedMessage, $keyword)) {
                return true;
            }
        }

        return false;
    }

    // Sirve para normalizar texto para comparaciones
    private function normalizeText(?string $text): string
    {
        $value = mb_strtolower((string) $text, 'UTF-8');
        $transliterated = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);

        return $transliterated === false ? $value : mb_strtolower($transliterated, 'UTF-8');
    }

    // Sirve para formatear una receta para la respuesta del chatbot
    private function formatRecipe(RecetaOriginal $recipe, string $userMessage, ?string $chatMessage = null): array
    {
        $ingredients = $recipe->ingredientes->map(function ($ingredient) {
            return [
                'nombre' => $ingredient->nombre,
                'cantidad' => $ingredient->pivot->cantidad,
                'unidad' => $ingredient->pivot->unidad,
                'unidad_texto' => $this->unitLabel((string) $ingredient->pivot->unidad),
            ];
        })->values()->all();

        $imagePaths = $this->collectImagePaths($recipe);
        $instructionSteps = $this->splitInstructions((string) $recipe->instrucciones);

        return [
            'id_receta' => (int) $recipe->id_receta,
            'titulo' => $recipe->titulo,
            'descripcion' => $recipe->descripcion,
            'instrucciones' => $recipe->instrucciones,
            'pasos' => $instructionSteps,
            'tiempo_preparacion' => (int) $recipe->tiempo_preparacion,
            'tiempo_preparacion_unidad' => $recipe->tiempo_preparacion_unidad,
            'tiempo_texto' => $recipe->tiempo_preparacion . ' ' . $this->timeUnitLabel((string) $recipe->tiempo_preparacion_unidad),
            'dificultad' => $recipe->dificultad,
            'dificultad_texto' => $this->difficultyLabel((string) $recipe->dificultad),
            'porciones' => (int) $recipe->porciones,
            'price' => $recipe->price,
            'ingredientes' => $ingredients,
            'imagenes' => $imagePaths,
            'imagen_principal' => $imagePaths[0] ?? null,
            'autor' => $recipe->autor?->nombre ?? 'Anónimo',
            'fecha_creacion' => $recipe->fecha_creacion,
            'mensaje_chat' => $chatMessage ?: $this->buildAssistantMessage($recipe, $userMessage, $ingredients, $instructionSteps),
        ];
    }

    // Sirve para recopilar las URLs de imágenes de una receta
    private function collectImagePaths(RecetaOriginal $recipe): array
    {
        return array_values(array_filter([
            $recipe->imagen_1,
            $recipe->imagen_2,
            $recipe->imagen_3,
            $recipe->imagen_4,
            $recipe->imagen_5,
        ]));
    }

    // Sirve para dividir las instrucciones en pasos numerados
    private function splitInstructions(string $instructions): array
    {
        $lines = preg_split('/\r\n|\r|\n/', $instructions) ?: [];
        $steps = array_values(array_filter(array_map(function (string $line) {
            $clean = trim(preg_replace('/^\d+[\.)-]?\s*/', '', $line) ?? $line);
            return $clean;
        }, $lines)));

        if (!empty($steps)) {
            return $steps;
        }

        return array_values(array_filter(array_map('trim', preg_split('/(?<=[.!?])\s+/', $instructions) ?: [])));
    }

    // Sirve para construir el mensaje del asistente con la receta encontrada
    private function buildAssistantMessage(RecetaOriginal $recipe, string $userMessage, array $ingredients, array $steps): string
    {
        $topIngredients = collect($ingredients)
            ->take(4)
            ->map(function (array $ingredient) {
                $amount = $ingredient['cantidad'] !== null ? ' ' . rtrim(rtrim((string) $ingredient['cantidad'], '0'), '.') : '';
                $unit = $ingredient['unidad_texto'] !== '' ? ' ' . $ingredient['unidad_texto'] : '';
                return '- ' . $ingredient['nombre'] . $amount . $unit;
            })
            ->implode("\n");

        $topSteps = collect($steps)
            ->take(3)
            ->map(fn (string $step, int $index) => ($index + 1) . '. ' . $step)
            ->implode("\n");

        return "I put together a recipe idea inspired by what you asked for: {$recipe->titulo}.\n\n" .
            "I would frame it as a {$this->difficultyLabel((string) $recipe->dificultad)} recipe with an estimated time of {$recipe->tiempo_preparacion} {$this->timeUnitLabel((string) $recipe->tiempo_preparacion_unidad)}.\n\n" .
            "Key ingredients for this version:\n{$topIngredients}\n\n" .
            "I would start like this:\n{$topSteps}\n\n" .
            "I am also leaving you a reference image. If you want, I can reshape it into something quicker, lighter, or more indulgent.";
    }

    // Sirve para traducir la dificultad al texto mostrado
    private function difficultyLabel(string $difficulty): string
    {
        return match ($difficulty) {
            'hard' => 'hard',
            'medium' => 'medium',
            default => 'easy',
        };
    }

    // Sirve para traducir la unidad de tiempo al texto mostrado
    private function timeUnitLabel(string $unit): string
    {
        return $unit === 'hours' ? 'hours' : 'minutes';
    }

    // Sirve para traducir la unidad de ingrediente al texto mostrado
    private function unitLabel(string $unit): string
    {
        return match ($unit) {
            'kg' => 'kg',
            'mg' => 'mg',
            'g' => 'g',
            'l' => 'l',
            'ml' => 'ml',
            'unit' => 'units',
            default => $unit,
        };
    }
}
