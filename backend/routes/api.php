<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Public Routes
Route::prefix('auth')->group(function () {
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);
});

Route::get('/store/working-hours', function() {
    return response()->json(['message' => 'Store is open (placeholder)']);
});

Route::get('/store/queue-status', [\App\Http\Controllers\QueueController::class, 'status']);

Route::get('/products', function() {
    return response()->json(App\Models\Product::with(['primaryImage', 'components'])->active()->ordered()->get());
});
Route::get('/products/{product:slug}', function(App\Models\Product $product) {
    return response()->json($product->load(['images', 'components']));
});

// Protected Customer Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/checkout', [\App\Http\Controllers\CheckoutController::class, 'process']);
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
    Route::get('/addresses', [\App\Http\Controllers\AddressController::class, 'index']);
    Route::post('/addresses', [\App\Http\Controllers\AddressController::class, 'store']);
    Route::put('/addresses/{address}', [\App\Http\Controllers\AddressController::class, 'update']);
    Route::delete('/addresses/{address}', [\App\Http\Controllers\AddressController::class, 'destroy']);

    // Orders
    Route::get('/orders', function(Request $request) {
        return $request->user()->orders()->with('items')->latest()->get();
    });
    Route::get('/orders/{order_number}', [\App\Http\Controllers\CustomerOrderController::class, 'show']);
    Route::post('/orders/{order_number}/receipt', [\App\Http\Controllers\CustomerOrderController::class, 'uploadReceipt']);
});

// Protected Admin Routes
Route::middleware(['auth:sanctum', \App\Http\Middleware\AdminMiddleware::class])->prefix('admin')->group(function () {
    
    // Dashboard Stats
    Route::get('/stats', function() {
        return response()->json(['sales' => 0, 'orders' => 0]);
    });
    
    // Activity Logs
    Route::get('/activity-logs', [\App\Http\Controllers\ActivityLogController::class, 'index']);

    // Components
    Route::apiResource('components', \App\Http\Controllers\ComponentController::class ?? \Illuminate\Routing\Controller::class);
    
    // Products
    Route::apiResource('products', \App\Http\Controllers\ProductController::class);
    
    // Orders Management
    Route::post('orders/{order}/verify-payment', [\App\Http\Controllers\OrderController::class, 'verifyPayment']);
    Route::apiResource('orders', \App\Http\Controllers\OrderController::class);
    
    // Coupons
    Route::apiResource('coupons', \App\Http\Controllers\CouponController::class ?? \Illuminate\Routing\Controller::class);
});
