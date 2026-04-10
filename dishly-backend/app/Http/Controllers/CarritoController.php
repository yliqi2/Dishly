<?php

namespace App\Http\Controllers;

use App\Models\Carrito;
use App\Models\LineaCarrito;
use App\Models\RecetaOriginal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Throwable;

class CarritoController extends Controller
{
    public function getCarrito(Request $request): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            $carrito = $this->resolveUserCart((int) $user->id_usuario);

            if (!$carrito) {
                return response()->json([
                    'id_carrito' => null,
                    'fecha_creacion' => null,
                    'items' => [],
                    'total' => 0,
                ]);
            }

            $this->removeUnavailableCartItems((int) $carrito->id_carrito);

            $items = LineaCarrito::query()
                ->join('receta_original', 'linea_carrito.id_receta', '=', 'receta_original.id_receta')
                ->join('users', 'receta_original.id_autor', '=', 'users.id_usuario')
                ->where('linea_carrito.id_carrito', $carrito->id_carrito)
                ->where('receta_original.active', 1)
                ->select(
                    'linea_carrito.id_linea_carrito',
                    'linea_carrito.id_receta',
                    'linea_carrito.precio_unitario',
                    'receta_original.titulo',
                    'receta_original.descripcion',
                    'receta_original.imagen_1',
                    'receta_original.imagen_2',
                    'receta_original.imagen_3',
                    'receta_original.imagen_4',
                    'receta_original.imagen_5',
                    'receta_original.price',
                    'users.nombre as autor_nombre'
                )
                ->get();

            return response()->json([
                'id_carrito' => $carrito->id_carrito,
                'fecha_creacion' => $carrito->fecha_creacion,
                'items' => $items,
                'total' => (float) $items->sum('precio_unitario'),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not get cart.',
                'errors' => [
                    'server' => [$e->getMessage()],
                ],
            ], 500);
        }
    }

    public function addToCart(Request $request): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            $data = $request->validate([
                'id_receta' => ['required', 'integer', 'exists:receta_original,id_receta'],
            ]);

            $receta = RecetaOriginal::query()
                ->where('id_receta', (int) $data['id_receta'])
                ->where('active', 1)
                ->first();

            if (!$receta) {
                return response()->json([
                    'message' => 'Recipe not found.',
                ], 404);
            }

            $price = (float) ($receta->price ?? 0);
            if ($price <= 0) {
                return response()->json([
                    'message' => 'Only premium recipes can be added to the cart.',
                ], 422);
            }

            $carrito = $this->resolveUserCart((int) $user->id_usuario, true);

            $alreadyInCart = LineaCarrito::query()
                ->where('id_carrito', $carrito->id_carrito)
                ->where('id_receta', $receta->id_receta)
                ->exists();

            if ($alreadyInCart) {
                return response()->json([
                    'message' => 'This recipe is already in your cart.',
                ], 409);
            }

            $linea = new LineaCarrito();
            $linea->precio_unitario = $price;
            $linea->id_carrito = $carrito->id_carrito;
            $linea->id_receta = $receta->id_receta;
            $linea->save();

            return response()->json([
                'message' => 'Recipe added to cart successfully.',
                'item' => $linea,
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not add the recipe to the cart.',
                'errors' => [
                    'server' => [$e->getMessage()],
                ],
            ], 500);
        }
    }

    public function removeFromCart(Request $request, int $idReceta): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            $carrito = $this->resolveUserCart((int) $user->id_usuario);

            if (!$carrito) {
                return response()->json([
                    'message' => 'Cart not found.',
                ], 404);
            }

            $deleted = LineaCarrito::query()
                ->where('id_carrito', $carrito->id_carrito)
                ->where('id_receta', $idReceta)
                ->delete();

            if ($deleted === 0) {
                return response()->json([
                    'message' => 'Recipe not found in cart.',
                ], 404);
            }

            return response()->json([
                'message' => 'Recipe removed from cart successfully.',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not remove the recipe from the cart.',
                'errors' => [
                    'server' => [$e->getMessage()],
                ],
            ], 500);
        }
    }

    public function clearCart(Request $request): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            $carrito = $this->resolveUserCart((int) $user->id_usuario);

            if (!$carrito) {
                return response()->json([
                    'message' => 'Cart is already empty.',
                ]);
            }

            LineaCarrito::query()
                ->where('id_carrito', $carrito->id_carrito)
                ->delete();

            return response()->json([
                'message' => 'Cart cleared successfully.',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not clear the cart.',
                'errors' => [
                    'server' => [$e->getMessage()],
                ],
            ], 500);
        }
    }

    protected function resolveUserCart(int $userId, bool $createIfMissing = false): ?Carrito
    {
        $carrito = Carrito::query()
            ->where('id_usuario', $userId)
            ->first();

        if ($carrito || !$createIfMissing) {
            return $carrito;
        }

        $carrito = new Carrito();
        $carrito->fecha_creacion = now()->toDateString();
        $carrito->id_usuario = $userId;
        $carrito->save();

        return $carrito;
    }

    protected function removeUnavailableCartItems(int $cartId): void
    {
        $invalidRecipeIds = RecetaOriginal::query()
            ->rightJoin('linea_carrito', 'receta_original.id_receta', '=', 'linea_carrito.id_receta')
            ->where('linea_carrito.id_carrito', $cartId)
            ->where(function ($query) {
                $query->whereNull('receta_original.id_receta')
                    ->orWhere('receta_original.active', '!=', 1);
            })
            ->pluck('linea_carrito.id_receta');

        if ($invalidRecipeIds->isEmpty()) {
            return;
        }

        LineaCarrito::query()
            ->where('id_carrito', $cartId)
            ->whereIn('id_receta', $invalidRecipeIds->all())
            ->delete();
    }
}
