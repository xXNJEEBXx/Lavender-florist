<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ManualOrderController;

// Public Routes
Route::get('/version', function () {
    return response()->json(['version' => 'upload-v3']);
});

Route::post('/sync-images', function (Illuminate\Http\Request $request) {
    if ($request->header('X-Sync-Key') !== 'lavender-sync-999') abort(403);
    $path = $request->input('path');
    $file = $request->file('file');
    $file->storeAs(dirname($path), basename($path), 'public');
    return response()->json(['success' => true]);
});

Route::prefix('auth')->group(function () {
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);
});

Route::get('/store/working-hours', [\App\Http\Controllers\WorkingHoursController::class, 'index']);
Route::get('/store/available-slots', [\App\Http\Controllers\ScheduleController::class, 'availableSlots']);
Route::post('/store/expand-url', [\App\Http\Controllers\AddressController::class, 'expandUrl']);

// Delivery & Checkout
Route::post('delivery/estimate', [\App\Http\Controllers\DeliveryController::class, 'estimate']);
Route::post('checkout', [\App\Http\Controllers\CheckoutController::class, 'process']);
Route::post('coupons/validate', [\App\Http\Controllers\CouponController::class, 'validateCoupon']);

// Public Settings
Route::get('settings/public', [\App\Http\Controllers\AdminSettingsController::class, 'getPublicSettings']);

Route::post('/telegram/webhook', [\App\Http\Controllers\TelegramWebhookController::class, 'handle']);

Route::get('/store/queue-status', [\App\Http\Controllers\QueueController::class, 'status']);

Route::get('/products', function(Request $request) {
    $query = App\Models\Product::with(['primaryImage', 'components'])->active()->ordered();
    if ($request->has('category')) {
        $query->where('category', $request->category);
    }
    return response()->json($query->get());
});
Route::get('/products/{product:slug}', function(App\Models\Product $product) {
    return response()->json($product->load(['images', 'components']));
});

// Shared Orders (Public with Token)
Route::get('/shared-order/{token}', [\App\Http\Controllers\SharedOrderController::class, 'getSharedOrder']);
Route::put('/shared-order/{token}/items', [\App\Http\Controllers\SharedOrderController::class, 'updateItems']);
Route::post('/shared-order/{token}/checkout', [\App\Http\Controllers\SharedOrderController::class, 'checkout']);

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
        return $request->user()->orders()->with(['items.product.primaryImage', 'driver', 'address', 'customer'])->latest()->get();
    });
    Route::get('/orders/{order_number}', [\App\Http\Controllers\CustomerOrderController::class, 'show']);
    Route::post('/orders/{order_number}/receipt', [\App\Http\Controllers\CustomerOrderController::class, 'uploadReceipt']);
    Route::delete('/orders/{order_number}', [\App\Http\Controllers\CustomerOrderController::class, 'destroy']);
});

// Public Draft Orders
Route::get('/draft-orders/{token}', [\App\Http\Controllers\ManualOrderController::class, 'getDraftOrder']);
Route::post('/draft-orders/{token}/complete', [\App\Http\Controllers\ManualOrderController::class, 'completeDraftOrder']);

// Protected Admin Routes
Route::middleware(['auth:sanctum', \App\Http\Middleware\AdminMiddleware::class])->prefix('admin')->group(function () {
    
    // Dashboard Stats
    Route::get('/stats', [\App\Http\Controllers\DashboardController::class, 'index']);
    
    // Activity Logs
    Route::get('/activity-logs', [\App\Http\Controllers\ActivityLogController::class, 'index']);

    // Customers
    Route::get('/customers', [\App\Http\Controllers\CustomerController::class, 'index']);
    Route::get('/customers/{id}', [\App\Http\Controllers\CustomerController::class, 'show']);
    Route::post('/customers/{id}/toggle-active', [\App\Http\Controllers\CustomerController::class, 'toggleActive']);

    // Components
    Route::apiResource('components', \App\Http\Controllers\ComponentController::class ?? \Illuminate\Routing\Controller::class);
    
    // Coupons
    Route::apiResource('coupons', \App\Http\Controllers\CouponController::class);
    
    // Products
    Route::apiResource('products', \App\Http\Controllers\ProductController::class);
    
    // Orders Management
    Route::post('orders/manual/search-customer', [\App\Http\Controllers\ManualOrderController::class, 'searchCustomer']);
    Route::post('orders/manual/checkout', [\App\Http\Controllers\ManualOrderController::class, 'checkout']);
    Route::get('orders/manual/draft/{token}', [\App\Http\Controllers\ManualOrderController::class, 'getDraft']);
    Route::put('orders/manual/draft/{token}', [\App\Http\Controllers\ManualOrderController::class, 'updateDraft']);
    Route::post('orders/manual/draft', [\App\Http\Controllers\ManualOrderController::class, 'createDraft']);
    Route::put('orders/{order}/full', [\App\Http\Controllers\OrderController::class, 'fullUpdate']);
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
    // Admins Management
    Route::apiResource('admins', \App\Http\Controllers\AdminController::class);
    
    // Admin Settings (Telegram)
    Route::get('settings/telegram', [\App\Http\Controllers\AdminSettingsController::class, 'getTelegram']);
    Route::put('settings/telegram', [\App\Http\Controllers\AdminSettingsController::class, 'updateTelegram']);
    
    // Store Settings
    Route::get('settings/store', [\App\Http\Controllers\AdminSettingsController::class, 'getStoreSettings']);
    Route::put('settings/store', [\App\Http\Controllers\AdminSettingsController::class, 'updateStoreSettings']);

});

// AI Chat (Publicly accessible for the widget)
Route::post('ai/chat', [\App\Http\Controllers\Admin\AiChatController::class, 'sendMessage']);
Route::get('ai/chat/history', [\App\Http\Controllers\Admin\AiChatController::class, 'getHistory']);

// Internal API for MCP Server
Route::prefix('internal')->group(function () {
    Route::get('tools', [\App\Http\Controllers\Admin\AiChatController::class, 'getToolsSchema']);
    Route::post('tools/execute', [\App\Http\Controllers\Admin\AiChatController::class, 'executeTool']);
});
