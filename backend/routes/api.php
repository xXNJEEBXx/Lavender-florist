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

Route::get('/store/working-hours', [\App\Http\Controllers\WorkingHoursController::class, 'index']);
Route::get('/store/available-slots', [\App\Http\Controllers\ScheduleController::class, 'availableSlots']);

Route::post('/telegram/webhook', [\App\Http\Controllers\TelegramWebhookController::class, 'handle']);

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
        return $request->user()->orders()->with(['items', 'driver'])->latest()->get();
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
    Route::post('orders/{order}/send-to-delivery', [\App\Http\Controllers\OrderController::class, 'sendToDelivery']);
    Route::apiResource('orders', \App\Http\Controllers\OrderController::class);
    
    // Drivers Management
    Route::post('drivers/{driver}/pay', [\App\Http\Controllers\DriverController::class, 'payDues']);
    Route::apiResource('drivers', \App\Http\Controllers\DriverController::class);
    
    // Working Hours Management
    Route::apiResource('working-hours', \App\Http\Controllers\WorkingHoursController::class)->except(['show']);
    
    // Admin Breaks
    Route::get('breaks', [\App\Http\Controllers\AdminBreakController::class, 'index']);
    Route::post('breaks', [\App\Http\Controllers\AdminBreakController::class, 'store']);
    Route::delete('breaks/{break}', [\App\Http\Controllers\AdminBreakController::class, 'destroy']);
    
    // Coupons
    // Route::apiResource('coupons', \App\Http\Controllers\CouponController::class);
});
