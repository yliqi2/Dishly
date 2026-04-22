<?php

namespace App\Http\Controllers;

use App\Models\Foro;
use App\Models\LineaForo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class ForumController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('api');

        $forums = Foro::query()
            ->with(['propietario:id_usuario,nombre,icon_path,updated_at'])
            ->withCount('comentarios')
            ->withMax('comentarios as last_activity_at', 'created_at')
            ->orderByRaw('COALESCE(last_activity_at, created_at) DESC')
            ->orderByDesc('id_foro')
            ->get()
            ->map(fn ($forum) => $this->mapForumSummary($forum, $user));

        return response()->json($forums);
    }

    public function show(Request $request, int $forumId): JsonResponse
    {
        $user = $request->user('api');
        $forum = Foro::query()
            ->with([
                'propietario:id_usuario,nombre,icon_path,updated_at',
                'comentarios' => fn ($query) => $query
                    ->with(['autor:id_usuario,nombre,icon_path,updated_at'])
                    ->orderBy('created_at')
                    ->orderBy('id_linea_foro'),
            ])
            ->withCount('comentarios')
            ->withMax('comentarios as last_activity_at', 'created_at')
            ->find($forumId);

        if (!$forum) {
            return response()->json([
                'message' => 'Forum not found.',
            ], 404);
        }

        $comments = $forum->comentarios
            ->map(fn ($comment) => $this->mapComment($comment, $user));

        return response()->json([
            ...$this->mapForumSummary($forum, $user),
            'comments' => $comments,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $user = $request->user('api');
            $data = $request->validate([
                'titulo' => ['required', 'string', 'max:160'],
                'descripcion' => ['required', 'string', 'max:4000'],
            ]);

            $cleanTitle = preg_replace('/\s+/', ' ', trim((string) $data['titulo'])) ?? '';
            $normalizedTitle = $this->normalizeForumTitle($cleanTitle);

            $duplicateTitleExists = Foro::query()
                ->select('titulo')
                ->get()
                ->contains(fn (Foro $forum) => $this->normalizeForumTitle((string) $forum->titulo) === $normalizedTitle);

            if ($duplicateTitleExists) {
                throw ValidationException::withMessages([
                    'titulo' => ['A forum with this title already exists. Please choose a different title.'],
                ]);
            }

            $forum = Foro::create([
                'titulo' => $cleanTitle,
                'descripcion' => trim((string) $data['descripcion']),
                'fecha_creacion' => now()->toDateString(),
                'id_usuario' => $user->id_usuario,
            ]);

            $forum->load(['propietario:id_usuario,nombre,icon_path,updated_at']);

            $forum->setAttribute('comentarios_count', 0);
            $forum->setAttribute('last_activity_at', $forum->created_at);

            return response()->json($this->mapForumDetail($forum, $user, []), 201);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $exception->errors(),
            ], 422);
        } catch (Throwable $throwable) {
            return response()->json([
                'message' => 'Forum could not be created.',
                'errors' => ['server' => [$throwable->getMessage()]],
            ], 500);
        }
    }

    public function storeComment(Request $request, int $forumId): JsonResponse
    {
        try {
            $user = $request->user('api');
            $forum = Foro::query()->find($forumId);
            if (!$forum) {
                return response()->json([
                    'message' => 'Forum not found.',
                ], 404);
            }

            $data = $request->validate([
                'mensaje' => ['required', 'string', 'max:4000'],
            ]);

            $comment = LineaForo::create([
                'mensaje' => trim((string) $data['mensaje']),
                'fecha' => now()->toDateString(),
                'id_foro' => $forum->id_foro,
                'id_usuario' => $user->id_usuario,
            ]);

            $comment->load(['autor:id_usuario,nombre,icon_path,updated_at']);

            return response()->json([
                'message' => 'Comment created successfully.',
                'comment' => $this->mapComment($comment, $user),
            ], 201);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $exception->errors(),
            ], 422);
        } catch (Throwable $throwable) {
            return response()->json([
                'message' => 'Comment could not be created.',
                'errors' => ['server' => [$throwable->getMessage()]],
            ], 500);
        }
    }

    public function updateComment(Request $request, int $forumId, int $commentId): JsonResponse
    {
        try {
            $comment = LineaForo::query()
                ->where('id_linea_foro', $commentId)
                ->where('id_foro', $forumId)
                ->first();

            if (!$comment) {
                return response()->json([
                    'message' => 'Comment not found.',
                ], 404);
            }

            if (!$this->canManageComment($request->user('api'), $comment)) {
                return response()->json([
                    'message' => 'You are not allowed to edit this comment.',
                ], 403);
            }

            $data = $request->validate([
                'mensaje' => ['required', 'string', 'max:4000'],
            ]);

            $comment->mensaje = trim((string) $data['mensaje']);
            $comment->save();

            $comment->load(['autor:id_usuario,nombre,icon_path,updated_at']);

            return response()->json([
                'message' => 'Comment updated successfully.',
                'comment' => $this->mapComment($comment, $request->user('api')),
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $exception->errors(),
            ], 422);
        } catch (Throwable $throwable) {
            return response()->json([
                'message' => 'Comment could not be updated.',
                'errors' => ['server' => [$throwable->getMessage()]],
            ], 500);
        }
    }

    public function destroyComment(Request $request, int $forumId, int $commentId): JsonResponse
    {
        try {
            $comment = LineaForo::query()
                ->where('id_linea_foro', $commentId)
                ->where('id_foro', $forumId)
                ->first();

            if (!$comment) {
                return response()->json([
                    'message' => 'Comment not found.',
                ], 404);
            }

            if (!$this->canManageComment($request->user('api'), $comment)) {
                return response()->json([
                    'message' => 'You are not allowed to delete this comment.',
                ], 403);
            }

            $comment->delete();

            return response()->json([
                'message' => 'Comment deleted successfully.',
            ]);
        } catch (Throwable $throwable) {
            return response()->json([
                'message' => 'Comment could not be deleted.',
                'errors' => ['server' => [$throwable->getMessage()]],
            ], 500);
        }
    }

    private function canManageComment(?object $user, LineaForo $comment): bool
    {
        if (!$user) {
            return false;
        }

        return (int) $user->id_usuario === (int) $comment->id_usuario || ($user->rol ?? null) === 'admin';
    }

    private function mapForumSummary(object $forum, ?object $user): array
    {
        $owner = $forum->propietario ?? null;

        return [
            'id_foro' => (int) $forum->id_foro,
            'titulo' => $forum->titulo,
            'descripcion' => $forum->descripcion,
            'fecha_creacion' => $forum->fecha_creacion,
            'created_at' => $forum->created_at,
            'updated_at' => $forum->updated_at,
            'comments_count' => isset($forum->comentarios_count) ? (int) $forum->comentarios_count : null,
            'last_activity_at' => $forum->last_activity_at ?? $forum->created_at,
            'is_owner' => $user ? (int) $user->id_usuario === (int) $forum->id_usuario : false,
            'owner' => [
                'id_usuario' => (int) $forum->id_usuario,
                'nombre' => $owner?->nombre,
                'icon_path' => $owner?->icon_path,
                'updated_at' => $owner?->updated_at,
            ],
        ];
    }

    private function mapForumDetail(object $forum, ?object $user, iterable $comments): array
    {
        return [
            ...$this->mapForumSummary($forum, $user),
            'comments' => array_values(is_array($comments) ? $comments : iterator_to_array($comments)),
        ];
    }

    private function mapComment(object $comment, ?object $user): array
    {
        $author = $comment->autor ?? null;
        $isOwner = $user ? (int) $user->id_usuario === (int) $comment->id_usuario : false;
        $isAdmin = $user ? ($user->rol ?? null) === 'admin' : false;

        return [
            'id_linea_foro' => (int) $comment->id_linea_foro,
            'id_foro' => (int) $comment->id_foro,
            'id_usuario' => (int) $comment->id_usuario,
            'mensaje' => $comment->mensaje,
            'fecha' => $comment->fecha,
            'created_at' => $comment->created_at,
            'updated_at' => $comment->updated_at,
            'autor_nombre' => $author?->nombre,
            'autor_icon_path' => $author?->icon_path,
            'autor_updated_at' => $author?->updated_at,
            'can_edit' => $isOwner || $isAdmin,
            'can_delete' => $isOwner || $isAdmin,
        ];
    }

    private function normalizeForumTitle(string $title): string
    {
        $collapsed = preg_replace('/\s+/', ' ', trim($title)) ?? '';
        $lowered = mb_strtolower($collapsed, 'UTF-8');
        $transliterated = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $lowered);

        return $transliterated === false ? $lowered : mb_strtolower($transliterated, 'UTF-8');
    }
}
