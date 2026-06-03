<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Order;
use App\Models\Address;
use App\Models\Product;
use App\Models\OrderItem;
use App\Models\Component;
use App\Models\ActivityLog;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    public function process(Request $request)
    {
        $validated = $request->validate([
            'address_id' => 'nullable|exists:addresses,id',
            'delivery_type' => 'required|in:local,shipping,pickup',
            'delivery_fee' => 'required|numeric|min:0',
            'delivery_date' => 'nullable|date|after_or_equal:today',
            'payment_method' => 'required|in:cash_on_delivery,bank_transfer',
            'notes' => 'nullable|string',
            
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

            // 1. Check Address belongs to Customer if not pickup
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

            // 2. Process Cart Items and Calculate Total
            $subtotal = 0;
            $orderItemsData = [];
            $componentsToDeduct = [];

            foreach ($validated['items'] as $item) {
                $product = Product::with('components')->findOrFail($item['product_id']);
                
                // Calculate item total
                $unitPrice = $product->price; 
                // Note: we can use $product->compare_at_price logic here if needed, but assuming $product->price is the selling price
                $totalPrice = $unitPrice * $item['quantity'];
                
                $subtotal += $totalPrice;

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                    'gift_message' => $item['gift_message'] ?? null
                ];

                // Track components usage
                foreach ($product->components as $component) {
                    $neededQuantity = $component->pivot->quantity * $item['quantity'];
                    if (!isset($componentsToDeduct[$component->id])) {
                        $componentsToDeduct[$component->id] = 0;
                    }
                    $componentsToDeduct[$component->id] += $neededQuantity;
                }
            }

            // 3. Create Order
            $deliveryFee = $validated['delivery_fee'];
            $total = $subtotal + $deliveryFee;

            $order = Order::create([
                'order_number' => 'LF-' . date('Ymd') . '-' . rand(1000, 9999),
                'customer_id' => $customer->id,
                'status' => 'pending',
                'delivery_type' => $validated['delivery_type'],
                'address_id' => $address ? $address->id : null,
                'delivery_date' => $validated['delivery_date'] ?? null,
                'delivery_fee' => $deliveryFee,
                'subtotal' => $subtotal,
                'discount' => 0,
                'total' => $total,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'pending',
                'notes' => $validated['notes'] ?? null
            ]);

            // 4. Save Order Items and Gift Messages
            foreach ($orderItemsData as $itemData) {
                $giftMessage = $itemData['gift_message'];
                unset($itemData['gift_message']);
                
                $itemData['order_id'] = $order->id;
                $orderItem = OrderItem::create($itemData);

                // Assuming gift messages are tied to the order in the DB schema, 
                // wait, gift_messages table has order_id. We'll save the first one found.
                if ($giftMessage && !DB::table('gift_messages')->where('order_id', $order->id)->exists()) {
                    DB::table('gift_messages')->insert([
                        'order_id' => $order->id,
                        'sender_name' => $customer->name,
                        'message' => $giftMessage,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            // 5. Deduct Components Stock (Inventory Management)
            foreach ($componentsToDeduct as $componentId => $qtyToDeduct) {
                $component = Component::find($componentId);
                if ($component) {
                    $component->decrement('stock_quantity', $qtyToDeduct);
                    
                    // Create stock log (optional but good practice)
                    DB::table('component_stock_logs')->insert([
                        'component_id' => $componentId,
                        'performed_by' => $customer->id,
                        'type' => 'consumption',
                        'quantity' => -$qtyToDeduct,
                        'stock_after' => $component->stock_quantity,
                        'notes' => 'Consumed for order ' . $order->order_number,
                        'created_at' => now()
                    ]);
                }
            }

            // Log activity
            ActivityLog::create([
                'event_type' => 'created',
                'actor_type' => 'customer',
                'actor_id' => $customer->id,
                'subject_type' => Order::class,
                'subject_id' => $order->id,
                'description' => 'العميل ' . $customer->name . ' قام بإنشاء طلب جديد #' . $order->order_number,
                'ip_address' => $request->ip()
            ]);

            return response()->json([
                'message' => 'تم استلام طلبك بنجاح!',
                'order' => $order->load('items')
            ], 201);
        });
    }
}
