<?php

namespace App\Http\Controllers;

use App\Mail\SendEmail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class MailController extends Controller
{
    // Sirve para enviar el código de recuperación de contraseña por email
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::query()
            ->where('email', $validated['email'])
            ->where('is_active', true)
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'No active user was found with that email address.',
            ], 404);
        }

        $recoveryCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->recovery_code = $recoveryCode;
        $user->save();

        try {
            Mail::to($user->email)->send(
                new SendEmail(
                    'No Reply - Account Recovery',
                    'We received an account recovery request for your Dishly account. Use the 6-digit code below to reset your password.',
                    $user->nombre,
                    $recoveryCode,
                )
            );

            return response()->json([
                'message' => 'Recovery code sent successfully.',
            ]);
        } catch (Throwable $throwable) {
            return response()->json([
                'message' => 'The email could not be sent.',
                'error' => $throwable->getMessage(),
            ], 500);
        }
    }

    // Sirve para restablecer la contraseña con el código de recuperación
    public function resetPassword(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => ['required', 'email'],
                'recovery_code' => ['required', 'digits:6'],
                'new_password' => ['required', 'string', 'min:8', 'confirmed'],
            ], [
                'recovery_code.required' => 'Recovery code is required.',
                'recovery_code.digits' => 'Recovery code must contain 6 digits.',
                'new_password.required' => 'New password is required.',
                'new_password.min' => 'New password must be at least 8 characters.',
                'new_password.confirmed' => 'Password confirmation does not match.',
            ]);

            $user = User::query()
                ->where('email', $validated['email'])
                ->where('is_active', true)
                ->first();

            if (!$user) {
                return response()->json([
                    'message' => 'No active user was found with that email address.',
                ], 404);
            }

            if ($user->recovery_code !== $validated['recovery_code']) {
                return response()->json([
                    'message' => 'The recovery code is not valid.',
                    'errors' => ['recovery_code' => ['The recovery code is not valid.']],
                ], 422);
            }

            $user->password = Hash::make($validated['new_password']);
            $user->recovery_code = null;
            $user->save();

            return response()->json([
                'message' => 'Password reset successfully.',
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $exception->errors(),
            ], 422);
        } catch (Throwable $throwable) {
            return response()->json([
                'message' => 'Could not reset password right now.',
                'errors' => ['server' => [$throwable->getMessage()]],
            ], 500);
        }
    }
}
