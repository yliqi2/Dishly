<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Throwable;

class UserController extends Controller
{
    public function updatePersonalInfo(Request $request)
    {
        try {
            /** @var User $user */
            $user = Auth::guard('api')->user();

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id_usuario . ',id_usuario',
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

            if (!Hash::check($validated['current_password'], $user->password)) {
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
