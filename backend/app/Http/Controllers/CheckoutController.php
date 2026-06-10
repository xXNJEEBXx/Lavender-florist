<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Order;
use App\Models\Address;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\ActivityLog;
use App\Services\OrderService;
use App\Services\TelegramService;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    protected $orderService;
    protected $telegramService;

    public function __construct(OrderService $orderService, TelegramService $telegramService)
    {
        $this->orderService = $orderService;
        $this->telegramService = $telegramService;
    }

    public function process(Request $request)
    {
        \Illuminate\Support\Facades\Log::info("Checkout Payload:", $request->all());
        $validated = $request->validate([
            'address_id' => 'nullable|exists:addresses,id',
            'delivery_type' => 'required|in:local,shipping,pickup',
            'delivery_speed' => 'nullable|in:standard,express',
            'delivery_fee' => 'required|numeric|min:0',
            'original_delivery_fee' => 'nullable|numeric|min:0',
            'delivery_minutes' => 'nullable|integer|min:0',
            'delivery_date' => 'nullable|date|after_or_equal:today',
            'scheduled_date' => 'nullable|date|after_or_equal:today',
            'scheduled_time' => 'nullable|string',
            'payment_method' => 'required|in:cash_on_delivery,bank_transfer',
            'notes' => 'nullable|string',
            'owner_name' => 'nullable|string|max:255',
            'owner_phone' => 'nullable|string|max:255',
            'coupon_code' => 'nullable|string',
            
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.gift_message' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // 1. Get Logged in Customer
            $customer = $request->user();
            if (!$customer) {
                throw ValidationException::withMessages(['auth' => 'يجب تسجيل الدخول أولاً']);
            }

            // 2. Check Address belongs to Customer if not pickup
            $address = null;
            if ($validated['delivery_type'] !== 'pickup') {
                if (empty($validated['address_id'])) {
                    throw ValidationException::withMessages(['address_id' => 'الرجاء اختيار عنوان التوصيل']);
                }
                $address = Address::where('id', $validated['address_id'])
                                  ->where('user_id', $customer->id)
                                  ->first();
                                  
                if (!$address) {
                    throw ValidationException::withMessages(['address_id' => 'العنوان غير صالح']);
                }
            }

            // 3. Process Cart Items
            [$subtotal, $orderItemsData, $componentsToDeduct] = $this->orderService->processOrderItems($validated['items']);

            // 4. Validate Stock
            $this->orderService->validateStock($componentsToDeduct);

            // 5. Handle Scheduling Logic
            [$scheduledAt, $readyBy] = $this->orderService->determineScheduling(
                $validated['delivery_type'],
                $validated['scheduled_date'] ?? null,
                $validated['scheduled_time'] ?? null
            );

            // 6. Calculate Fees and Discounts
            $frontendDeliveryFee = $validated['delivery_fee'];
            $originalFee = $validated['original_delivery_fee'] ?? $this->orderService->calculateOriginalFee(
                $validated['delivery_type'],
                $validated['delivery_minutes'] ?? null,
                $validated['delivery_speed'] ?? 'standard',
                $frontendDeliveryFee
            );
            
            [$discount, $couponId, $finalDeliveryFee] = $this->orderService->applyCoupon(
                $validated['coupon_code'] ?? null, 
                $subtotal, 
                $frontendDeliveryFee, 
                $customer->id
            );

            $driverFee = $this->orderService->calculateDriverFee($frontendDeliveryFee, $finalDeliveryFee, $originalFee);

            // 7. Create Order
            $deliveryFee = $finalDeliveryFee;
            $total = max(0, $subtotal - $discount) + $deliveryFee;

            $order = Order::create([
                'order_number' => 'LF-' . date('Ymd') . '-' . rand(1000, 9999),
                'customer_id' => $customer->id,
                'status' => 'pending',
                'delivery_type' => $validated['delivery_type'],
                'delivery_speed' => $validated['delivery_speed'] ?? 'standard',
                'address_id' => $address ? $address->id : null,
                'delivery_date' => $validated['delivery_date'] ?? null,
                'scheduled_at' => $scheduledAt,
                'ready_by' => $readyBy,
                'delivery_fee' => $deliveryFee,
                'driver_fee' => $driverFee,
                'delivery_minutes' => $validated['delivery_minutes'] ?? null,
                'driver_notes' => $address ? $address->delivery_notes : null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'coupon_id' => $couponId,
                'total' => $total,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'pending',
                'notes' => $validated['notes'] ?? null,
                'owner_name' => $validated['owner_name'] ?? null,
                'owner_phone' => $validated['owner_phone'] ?? null
            ]);

            // 8. Save Order Items
            $this->orderService->saveOrderItems($order, $orderItemsData, $customer->name);

            // 9. Record Coupon Usage
            if ($couponId) {
                CouponUsage::create([
                    'coupon_id' => $couponId,
                    'user_id' => $customer->id,
                    'order_id' => $order->id,
                    'discount_amount' => $discount,
                ]);
                Coupon::find($couponId)->increment('times_used');
            }

            // 10. Deduct Components Stock
            $this->orderService->deductStock($componentsToDeduct, $customer->id, $order->order_number);

            // 11. Log activity
            ActivityLog::create([
                'event_type' => 'created',
                'actor_type' => 'customer',
                'actor_id' => $customer->id,
                'subject_type' => Order::class,
                'subject_id' => $order->id,
                'description' => 'العميل ' . $customer->name . ' قام بإنشاء طلب جديد #' . $order->order_number,
                'ip_address' => $request->ip()
            ]);

            // 12. Notify admins
            if ($order->payment_method !== 'bank_transfer') {
                try {
                    $this->telegramService->notifyNewOrder($order);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to notify admins', ['error' => $e->getMessage()]);
                }
            }

            return response()->json([
                'message' => 'تم استلام طلبك بنجاح!',
                'order' => $order->load('items')
            ], 201);
        });
    }
}
