<?php

namespace App\Http\Controllers;

use App\Mail\SendEmail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Throwable;

class MailController extends Controller
{
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
}
