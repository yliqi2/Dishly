<?php

namespace App\Http\Controllers;

use App\Models\Carrito;
use App\Models\Factura;
use App\Models\LineaCarrito;
use App\Models\LineaFactura;
use App\Models\RecetaAdquirida;
use App\Models\RecetaOriginal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Throwable;

class CarritoController extends Controller
{
    // Sirve para obtener el carrito del usuario con sus items y total
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

    // Sirve para añadir una receta de pago al carrito
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

    // Sirve para eliminar una receta del carrito
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

    // Sirve para vaciar el carrito del usuario
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

    // Sirve para obtener o crear el carrito de un usuario
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

    // Sirve para quitar del carrito recetas inactivas o inexistentes
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

    // Sirve para procesar el pago, facturar y transferir recetas adquiridas
    public function pagar(Request $request): JsonResponse
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

            $this->removeUnavailableCartItems((int) $carrito->id_carrito);

            $cartItems = $this->getPurchasableCartItems((int) $carrito->id_carrito);

            if ($cartItems->isEmpty()) {
                return response()->json([
                    'message' => 'Cart has no payable recipes.',
                ], 422);
            }

            $acquiredCount = 0;
            $invoiceId = 0;
            $invoiceTotal = 0.0;
            $purchasedItems = [];

            DB::transaction(function () use ($user, $carrito, $cartItems, &$acquiredCount, &$invoiceId, &$invoiceTotal, &$purchasedItems): void {
                $factura = $this->createInvoiceFromCartItems((int) $user->id_usuario, $cartItems);
                $invoiceId = (int) $factura->id_factura;
                $invoiceTotal = (float) $factura->total;

                $this->createInvoiceLinesFromCartItems($invoiceId, $cartItems);

                $acquiredCount = $this->transferCartItemsToAcquiredRecipes(
                    (int) $user->id_usuario,
                    $cartItems
                );

                LineaCarrito::query()
                    ->where('id_carrito', $carrito->id_carrito)
                    ->delete();

                $purchasedItems = $cartItems
                    ->map(static fn ($item): array => [
                        'id_receta' => (int) $item->id_receta,
                        'titulo' => (string) $item->titulo,
                        'precio_unitario' => (float) $item->precio_unitario,
                        'imagen_1' => $item->imagen_1,
                    ])
                    ->values()
                    ->all();
            });

            return response()->json([
                'message' => 'Payment processed successfully. Your cart has been cleared.',
                'acquired_count' => $acquiredCount,
                'invoice_id' => $invoiceId,
                'invoice_total' => $invoiceTotal,
                'purchased_items' => $purchasedItems,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not process payment.',
                'errors' => [
                    'server' => [$e->getMessage()],
                ],
            ], 500);
        }
    }

    // Sirve para obtener las líneas del carrito que se pueden pagar
    protected function getPurchasableCartItems(int $cartId): Collection
    {
        return LineaCarrito::query()
            ->join('receta_original', 'linea_carrito.id_receta', '=', 'receta_original.id_receta')
            ->where('linea_carrito.id_carrito', $cartId)
            ->where('receta_original.active', 1)
            ->select(
                'linea_carrito.id_receta',
                'linea_carrito.precio_unitario',
                'receta_original.titulo',
                'receta_original.imagen_1'
            )
            ->get();
    }

    // Sirve para crear la factura con el total del carrito
    protected function createInvoiceFromCartItems(int $userId, Collection $cartItems): Factura
    {
        $factura = new Factura();
        $factura->fecha = now()->toDateString();
        $factura->total = (float) $cartItems->sum(fn ($item): float => (float) $item->precio_unitario);
        $factura->id_usuario = $userId;
        $factura->save();

        return $factura;
    }

    // Sirve para crear las líneas de factura a partir del carrito
    protected function createInvoiceLinesFromCartItems(int $invoiceId, Collection $cartItems): void
    {
        $groupedItems = $cartItems->groupBy(fn ($item): string => ((int) $item->id_receta) . '|' . ((float) $item->precio_unitario));

        foreach ($groupedItems as $items) {
            $first = $items->first();
            $quantity = $items->count();
            $unitPrice = (float) $first->precio_unitario;

            $lineaFactura = new LineaFactura();
            $lineaFactura->cantidad = $quantity;
            $lineaFactura->subtotal = $quantity * $unitPrice;
            $lineaFactura->id_factura = $invoiceId;
            $lineaFactura->id_receta = (int) $first->id_receta;
            $lineaFactura->save();
        }
    }

    // Sirve para registrar las recetas compradas en receta_adquirida
    protected function transferCartItemsToAcquiredRecipes(int $userId, Collection $cartItems): int
    {
        if ($cartItems->isEmpty()) {
            return 0;
        }

        $recipeIds = $cartItems
            ->pluck('id_receta')
            ->map(static fn ($id): int => (int) $id)
            ->all();

        $existingRecipeIds = RecetaAdquirida::query()
            ->where('id_usuario', $userId)
            ->whereIn('id_receta', $recipeIds)
            ->pluck('id_receta')
            ->map(static fn ($id): int => (int) $id)
            ->all();

        $existingLookup = array_flip($existingRecipeIds);
        $created = 0;

        foreach ($cartItems as $item) {
            $recipeId = (int) $item->id_receta;

            if (isset($existingLookup[$recipeId])) {
                continue;
            }

            $recetaAdquirida = new RecetaAdquirida();
            $recetaAdquirida->fecha_compra = now()->toDateString();
            $recetaAdquirida->precio = (float) $item->precio_unitario;
            $recetaAdquirida->id_usuario = $userId;
            $recetaAdquirida->id_receta = $recipeId;
            $recetaAdquirida->save();

            $existingLookup[$recipeId] = true;
            $created++;
        }

        return $created;
    }
}
