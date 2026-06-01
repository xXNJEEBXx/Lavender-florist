<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Public Routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);
});

Route::get('/store/working-hours', function() {
    return response()->json(['message' => 'Store is open (placeholder)']);
});

Route::get('/products', function() {
    return response()->json(App\Models\Product::with(['primaryImage', 'components'])->active()->ordered()->get());
});
Route::get('/products/{product:slug}', function(App\Models\Product $product) {
    return response()->json($product->load(['images', 'components']));
});

// Protected Customer Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Cart
    Route::prefix('cart')->group(function () {
        Route::get('/', function(Request $request) {
            return $request->user()->cart()->with('items.product.primaryImage')->first();
        });
        // placeholders for add, update, remove
    });

    // Profile & Addresses
    Route::get('/addresses', function(Request $request) {
        return $request->user()->addresses;
    });

    // Orders
    Route::get('/orders', function(Request $request) {
        return $request->user()->orders()->with('items')->latest()->get();
    });
});

// Protected Admin Routes
Route::middleware(['auth:sanctum', \App\Http\Middleware\AdminMiddleware::class])->prefix('admin')->group(function () {
    
    // Dashboard Stats
    Route::get('/stats', function() {
        return response()->json(['sales' => 0, 'orders' => 0]);
    });

    // Components
    Route::apiResource('components', \App\Http\Controllers\ComponentController::class ?? \Illuminate\Routing\Controller::class);
    
    // Products
    Route::apiResource('products', \App\Http\Controllers\ProductController::class ?? \Illuminate\Routing\Controller::class);
    
    // Orders Management
    Route::apiResource('orders', \App\Http\Controllers\OrderController::class ?? \Illuminate\Routing\Controller::class);
    
    // Coupons
    Route::apiResource('coupons', \App\Http\Controllers\CouponController::class ?? \Illuminate\Routing\Controller::class);
});
