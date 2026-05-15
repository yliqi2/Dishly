<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class UserController extends Controller
{
    // Sirve para obtener el perfil público de un usuario con sus recetas
    public function showPublicProfile(int $id)
    {
        try {
            $user = DB::table('users')
                ->where('id_usuario', $id)
                ->where('is_active', true)
                ->select('id_usuario', 'nombre', 'icon_path', 'updated_at', 'created_at', 'chef')
                ->first();

            if (! $user) {
                return response()->json([
                    'message' => 'User not found.',
                ], 404);
            }

            $recipes = DB::table('receta_original')
                ->where('id_autor', $id)
                ->where('active', 1)
                ->orderByDesc('fecha_creacion')
                ->get();

            if ($recipes->isNotEmpty()) {
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

                $viewer = Auth::guard('api')->user();
                $purchasedIdSet = [];
                if ($viewer) {
                    $purchasedIds = DB::table('receta_adquirida')
                        ->where('id_usuario', $viewer->id_usuario)
                        ->whereIn('id_receta', $recipeIds)
                        ->pluck('id_receta');
                    foreach ($purchasedIds as $rid) {
                        $purchasedIdSet[(int) $rid] = true;
                    }
                }

                foreach ($recipes as $recipe) {
                    $recipe->categorias = $categorias->get($recipe->id_receta, []);
                    $recipe->ingredientes = $ingredientes->get($recipe->id_receta, []);
                    $recipe->media_valoraciones = $valoraciones->get($recipe->id_receta)->media_valoraciones ?? null;
                    $recipe->autor_nombre = $user->nombre;
                    $recipe->autor_icon_path = $user->icon_path;
                    $recipe->autor_updated_at = $user->updated_at;
                    $recipe->purchased = isset($purchasedIdSet[(int) $recipe->id_receta]);
                }
            }

            return response()->json([
                'user' => [
                    'id_usuario' => (int) $user->id_usuario,
                    'nombre' => $user->nombre,
                    'icon_path' => $user->icon_path,
                    'updated_at' => $user->updated_at,
                    'created_at' => $user->created_at,
                    'chef' => (bool) $user->chef,
                ],
                'recipes_count' => $recipes->count(),
                'recipes' => $recipes->values(),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not get public profile.',
                'errors' => ['server' => [$e->getMessage()]],
            ], 500);
        }
    }

    // Sirve para actualizar el nombre y email del usuario autenticado
    public function updatePersonalInfo(Request $request)
    {
        try {
            /** @var User $user */
            $user = Auth::guard('api')->user();

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => [
                    'sometimes',
                    'string',
                    'email',
                    'max:255',
                    Rule::unique('users', 'email')->ignore($user->id_usuario, 'id_usuario')->where('is_active', true),
                ],
            ], [
                'email.unique' => 'This email is already in use.',
                'email.email' => 'Please provide a valid email address.',
            ]);

            if (empty($validated)) {
                return response()->json([
                    'message' => 'No personal information provided to update',
                    'errors' => ['payload' => ['At least one of name or email is required.']],
                ], 422);
            }

            if (isset($validated['name'])) {
                $user->nombre = $validated['name'];
            }
            if (isset($validated['email'])) {
                $user->email = $validated['email'];
            }
            $user->save();

            return response()->json([
                'message' => 'Personal information updated successfully',
                'user' => $user->fresh(),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not update personal information',
                'errors' => ['server' => [$e->getMessage()]],
            ], 500);
        }
    }

    // Sirve para cambiar la contraseña del usuario autenticado
    public function updatePassword(Request $request)
    {
        try {
            /** @var User $user */
            $user = Auth::guard('api')->user();

            $validated = $request->validate([
                'current_password' => 'required|string|min:8',
                'new_password' => 'required|string|min:8',
            ], [
                'current_password.required' => 'Current password is required.',
                'new_password.required' => 'New password is required.',
                'new_password.min' => 'New password must be at least 8 characters.',
            ]);

            if (! Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Current password is not correct.',
                    'errors' => ['current_password' => ['Current password is not correct.']],
                ], 422);
            }

            $user->password = Hash::make($validated['new_password']);
            $user->save();

            return response()->json([
                'message' => 'Password updated successfully.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not update password',
                'errors' => ['server' => [$e->getMessage()]],
            ], 500);
        }
    }

    // Sirve para desactivar la cuenta del usuario y cerrar sesión
    public function deactivateAccount(Request $request)
    {
        try {
            /** @var User $user */
            $user = Auth::guard('api')->user();

            $user->update(['is_active' => false, 'email' => null]);
            Auth::guard('api')->logout();

            return response()->json([
                'message' => 'Account deleted successfully.',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Couldn\'t delete account',
                'errors' => ['server' => [$e->getMessage()]],
            ], 500);
        }
    }

    public function index()
    {
        $users = User::all();

        return view('welcome', compact('users'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);
        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
        ]);

        return redirect()->route('users.index')->with('success', 'Usuario creado correctamente');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return redirect()->route('users.index')->with('success', 'Usuario eliminado correctamente');
    }
}
