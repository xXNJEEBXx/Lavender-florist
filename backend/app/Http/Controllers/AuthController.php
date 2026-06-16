<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $email = strtolower(trim($request->email));

        // Generate 4-digit OTP
        $otp = (string) random_int(1000, 9999);

        // In local/testing, we might use a fixed OTP or just use random but we will always log it just in case
        \Illuminate\Support\Facades\Log::info("OTP for {$email} is {$otp}");

        // Cache the OTP for 10 minutes
        \Illuminate\Support\Facades\Cache::put("otp_{$email}", $otp, now()->addMinutes(10));

        // Send Email via Resend
        $resendKey = env('RESEND_API_KEY');
        if ($resendKey) {
            \Illuminate\Support\Facades\Http::withToken($resendKey)
                ->post('https://api.resend.com/emails', [
                    'from' => 'Lavender Florist <onboarding@resend.dev>', // Use verified domain later
                    'to' => $email,
                    'subject' => 'Your Verification Code - Lavender Florist',
                    'html' => "
                    <div dir='ltr' style='font-family: \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; text-align: center; background-color: #faf5ff; border-radius: 16px;'>
                        <h2 style='color: #4c1d95; margin-bottom: 20px; font-weight: 700; font-size: 24px;'>Lavender Florist</h2>
                        <div style='background-color: #ffffff; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);'>
                            <p style='color: #4b5563; font-size: 16px; margin-bottom: 30px;'>Hello,</p>
                            <p style='color: #4b5563; font-size: 16px; margin-bottom: 30px;'>Please use the verification code below to sign in to your account. This code is valid for the next 10 minutes.</p>
                            <div style='background-color: #f3e8ff; padding: 15px 30px; border-radius: 8px; display: inline-block; margin-bottom: 30px;'>
                                <h1 style='color: #7c3aed; letter-spacing: 8px; font-size: 42px; margin: 0; font-weight: 800;'>{$otp}</h1>
                            </div>
                            <p style='color: #6b7280; font-size: 14px; margin-top: 20px; border-top: 1px solid #f3f4f6; padding-top: 20px;'>If you didn't request this code, you can safely ignore this email.</p>
                        </div>
                        <p style='color: #9ca3af; font-size: 12px; margin-top: 30px;'>&copy; " . date('Y') . " Lavender Florist. All rights reserved.</p>
                    </div>"
                ]);
        }

        return response()->json(['message' => 'OTP sent successfully']);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:4',
        ]);

        $email = strtolower(trim($request->email));
        $cachedOtp = \Illuminate\Support\Facades\Cache::get("otp_{$email}");

        if (!$cachedOtp || $cachedOtp !== $request->otp) {
            // For testing purposes, allow '0000' as a master OTP if not in production
            if (app()->environment('local') && $request->otp === '0000') {
                // Allow
            } else {
                throw ValidationException::withMessages([
                    'otp' => ['رمز التحقق غير صحيح أو منتهي الصلاحية.'],
                ]);
            }
        }

        // OTP is valid, clear it
        \Illuminate\Support\Facades\Cache::forget("otp_{$email}");

        // Find or create user
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => 'عميل لافندر', // Default name
                'password' => Hash::make(Str::random(40)), // We don't use passwords
                'role' => 'customer',
                'auth_provider' => 'email',
                'is_active' => true,
            ]
        );

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['تم إيقاف هذا الحساب.'],
            ]);
        }

        $user->update(['last_login_at' => now()]);
        
        // Ensure cart exists
        if (!$user->cart) {
            Cart::create(['user_id' => $user->id]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user->load('defaultAddress'),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Successfully logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('defaultAddress'));
    }

    // Google OAuth placeholders
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            $user = User::where('google_id', $googleUser->id)->orWhere('email', $googleUser->email)->first();
            
            if ($user) {
                // Update google id and avatar if missing
                if (!$user->google_id) {
                    $user->update([
                        'google_id' => $googleUser->id,
                        'avatar_url' => $user->avatar_url ?? $googleUser->avatar,
                        'auth_provider' => 'google'
                    ]);
                }
            } else {
                // Create new user
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'avatar_url' => $googleUser->avatar,
                    'password' => Hash::make(Str::random(24)),
                    'role' => 'customer',
                    'auth_provider' => 'google',
                ]);
                Cart::create(['user_id' => $user->id]);
            }

            $user->update(['last_login_at' => now()]);
            $token = $user->createToken('auth_token')->plainTextToken;

            // In SPA, we typically redirect back to frontend with the token
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return redirect()->away($frontendUrl . '/auth/callback?token=' . $token);

        } catch (\Exception $e) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return redirect()->away($frontendUrl . '/auth/callback?error=google_auth_failed');
        }
    }
}
