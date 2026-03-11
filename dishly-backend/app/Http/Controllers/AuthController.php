<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:10',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->where('is_active', true),
            ],
            'password' => 'required|string|min:8',
        ]);

        $nombre = $request->input('name', $request->input('nombre'));

        $user = User::create([
            'nombre' => $nombre,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'rol' => 'cliente',
            'chef' => false,
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!$token = Auth::guard('api')->attempt($credentials)) {
            return response()->json([
                'message' => 'Your email or password is incorrect. Please try again.'
            ], 401);
        }

        /** @var User $user */
        $user = Auth::guard('api')->user();

        if (!$user->is_active) {
            Auth::guard('api')->logout();

            return response()->json([
                'message' => 'This account has been deleted.'
            ], 401);
        }

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('api')->logout();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id_usuario,
            'password' => 'nullable|string|min:8',
        ]);

        $nombre = $request->input('name', $request->input('nombre'));

        $user->nombre = $nombre;
        $user->email = $request->email;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    public function deactivateAccount(Request $request)
    {
        try {
            /** @var User $user */
            $user = $request->user();

            $user->update([
                'is_active' => false,
                'email' => 'deleted_' . $user->id_usuario,
            ]);

            return response()->json([
                'message' => 'Account deleted successfully',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Couldn\'t delete account',
                'errors' => ['server' => [$e->getMessage()]],
            ], 500);
        }
    }

    public function uploadIcon(Request $request)
    {
        try {
            /** @var User $user */
            $user = $request->user();

            $request->validate([
                'icon' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
            ], [
                'icon.required' => 'Icon image is required.',
                'icon.image' => 'File must be an image.',
                'icon.mimes' => 'Icon must be jpeg, png, jpg, gif, or webp.',
                'icon.max' => 'Icon must be less than 10MB.',
            ]);

            $file = $request->file('icon');
            $ext = $file->getClientOriginalExtension();
            $filename = $user->id_usuario . '.' . $ext;
            $publicPath = public_path('users/icons');

            if (!file_exists($publicPath)) {
                mkdir($publicPath, 0755, true);
            }

            $oldPath = $user->icon_path ? public_path(ltrim($user->icon_path, '/')) : null;
            if ($oldPath && file_exists($oldPath)) {
                unlink($oldPath);
            }

            $file->move($publicPath, $filename);
            $user->icon_path = 'users/icons/' . $filename;
            $user->save();

            return response()->json([
                'message' => 'Icon uploaded successfully.',
                'user' => $user->fresh(),
            ]);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Couldn\'t upload icon',
                'errors' => ['icon' => [$e->getMessage()]],
            ], 500);
        }
    }
}
