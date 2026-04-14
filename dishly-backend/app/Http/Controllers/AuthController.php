<?php

namespace App\Http\Controllers;

use App\Mail\SendEmail;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
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
            $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            $user = DB::transaction(function () use ($nombre, $validated, $verificationCode) {
                $user = User::create([
                    'nombre' => $nombre,
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'recovery_code' => $verificationCode,
                    'usuario_verificado' => false,
                    'rol' => 'cliente',
                    'chef' => false,
                ]);

                $verificationUrl = $this->frontendVerificationUrl($user->email, $verificationCode);

                Mail::to($user->email)->send(
                    new SendEmail(
                        'Verify your Dishly email',
                        'Thanks for joining Dishly. Click the button below to verify your email address and activate your account.',
                        $user->nombre,
                        null,
                        $verificationUrl,
                        'Verify email'
                    )
                );

                return $user;
            });

            return response()->json([
                'message' => 'Registration successful. Please check your email to verify your account.',
                'user' => $user->fresh(),
            ], 201);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $exception->errors(),
            ], 422);
        } catch (Throwable $throwable) {
            return response()->json([
                'message' => 'Registration could not be completed right now.',
                'errors' => ['server' => [$throwable->getMessage()]],
            ], 500);
        }
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
                'message' => 'Your email or password is incorrect. Please try again.'
            ], 401);
        }

        if (!($user->usuario_verificado ?? false)) {
            Auth::guard('api')->logout();

            return response()->json([
                'message' => 'Please verify your email before logging in.'
            ], 403);
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

    public function verifyEmail(Request $request): RedirectResponse
    {
        $email = (string) $request->query('email', '');
        $code = (string) $request->query('code', '');

        return redirect()->away($this->frontendVerificationUrl($email, $code));
    }

    public function verifyEmailApi(Request $request)
    {
        $email = (string) $request->query('email', $request->input('email', ''));
        $code = (string) $request->query('code', $request->input('code', ''));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($code) !== 6) {
            return response()->json([
                'message' => 'This verification link is invalid or has expired.',
                'status' => 'invalid',
            ], 422);
        }

        $user = User::query()
            ->where('email', $email)
            ->where('is_active', true)
            ->first();

        if (!$user || $user->recovery_code !== $code) {
            return response()->json([
                'message' => 'This verification link is invalid or has expired.',
                'status' => 'invalid',
            ], 422);
        }

        if ($user->usuario_verificado) {
            return response()->json([
                'message' => 'Your email was already verified. You can log in normally.',
                'status' => 'already',
            ]);
        }

        $user->usuario_verificado = true;
        $user->recovery_code = null;
        $user->save();

        return response()->json([
            'message' => 'Your email has been verified successfully. You can now log in.',
            'status' => 'success',
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

    private function frontendVerificationUrl(string $email, string $code): string
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', 'https://https://stanchly-dulotic-sherri.ngrok-free.dev'), '/');

        return $frontendUrl
            . '/verifyEmail?email=' . urlencode($email)
            . '&code=' . urlencode($code);
    }

    private function verificationRedirectUrl(string $status): string
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', 'https://https://stanchly-dulotic-sherri.ngrok-free.dev'), '/');

        return $frontendUrl . '/login?verification=' . urlencode($status);
    }
}
