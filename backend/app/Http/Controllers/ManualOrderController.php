<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Utils\PhoneUtils;
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

class ManualOrderController extends Controller
{
    // ADMIN: Search Customer by Phone
    public function searchCustomer(Request $request)
    {
        $request->validate(['phone' => 'required|string']);
        $phone = PhoneUtils::normalize($request->phone);

        $user = User::where('phone', $phone)->with('addresses')->first();
        
        if ($user) {
            return response()->json([
                'found' => true,
                'customer' => $user
            ]);
        }

        return response()->json(['found' => false]);
    }

    // ADMIN: Create Draft Order (Link)
    public function createDraft(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'nullable|string',
            'customer_phone' => 'required|string',
            'delivery_type' => 'required|in:local,pickup',
            'delivery_speed' => 'nullable|in:standard,express',
            'delivery_date' => 'nullable|date',
            'scheduled_time' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.product_id' => 'required_with:items|exists:products,id',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.gift_message' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $subtotal = 0;
            $itemsData = [];

            $items = $validated['items'] ?? [];
            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $unitPrice = $product->price;
                $totalPrice = $unitPrice * $item['quantity'];
                $subtotal += $totalPrice;

                $itemsData[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                    'gift_message' => $item['gift_message'] ?? null,
                ];
            }

            $phone = PhoneUtils::normalize($validated['customer_phone']);
            $customerId = null;

            $customer = User::where('phone', $phone)->first();
            if (!$customer) {
                $customer = User::create([
                    'name' => $validated['customer_name'] ?? 'عميل لافندر',
                    'phone' => $phone,
                    'email' => 'customer_' . $phone . '@lavender.local',
                    'role' => 'customer',
                    'is_active' => true,
                    'password' => Hash::make(Str::random(12))
                ]);
            }
            $customerId = $customer->id;

            $order = Order::create([
                'order_number' => 'LF-' . date('Ymd') . '-' . rand(1000, 9999),
                'token' => Str::random(32),
                'is_draft' => true,
                'status' => 'pending',
                'customer_id' => $customerId,
                'owner_name' => $validated['customer_name'] ?? $customer->name,
                'owner_phone' => $phone,
                'delivery_type' => $validated['delivery_type'],
                'delivery_speed' => $validated['delivery_speed'] ?? 'standard',
                'delivery_date' => $validated['delivery_date'] ?? null,
                'delivery_time_slot' => $validated['scheduled_time'] ?? null,
                'subtotal' => $subtotal,
                'total' => $subtotal,
            ]);

            foreach ($itemsData as $itemData) {
                $gm = $itemData['gift_message'];
                unset($itemData['gift_message']);
                $itemData['order_id'] = $order->id;
                $orderItem = OrderItem::create($itemData);

                if ($gm) {
                    DB::table('gift_messages')->insert([
                        'order_id' => $order->id,
                        'order_item_id' => $orderItem->id,
                        'sender_name' => 'مسودة',
                        'message' => $gm,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return response()->json([
                'message' => 'تم إنشاء رابط الطلب بنجاح',
                'link' => "{$frontendUrl}/shared/{$order->token}",
                'token' => $order->token,
                'draft' => $order
            ]);
        });
    }

    // ADMIN: Get Draft Order
    public function getDraft($token)
    {
        $order = Order::where('token', $token)->where('is_draft', true)->with(['items.product', 'address'])->firstOrFail();
        return response()->json($order);
    }

    // ADMIN: Update Draft Order
    public function updateDraft(Request $request, $token)
    {
        $order = Order::where('token', $token)->where('is_draft', true)->firstOrFail();
        
        $validated = $request->validate([
            'customer_phone' => 'nullable|string',
            'customer_name' => 'nullable|string',
            'delivery_type' => 'nullable|in:local,pickup',
            'delivery_speed' => 'nullable|in:standard,express',
            'delivery_date' => 'nullable|date',
            'scheduled_time' => 'nullable|string',
            'delivery_fee' => 'nullable|numeric',
            'address_id' => 'nullable|exists:addresses,id',
            'address' => 'nullable|array',
            'payment_method' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.product_id' => 'required_with:items|exists:products,id',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.gift_message' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $order) {
            // Update items if provided
            if (isset($validated['items'])) {
                $order->items()->delete();
                $subtotal = 0;
                foreach ($validated['items'] as $itemData) {
                    $product = Product::findOrFail($itemData['product_id']);
                    $totalPrice = $product->price * $itemData['quantity'];
                    $subtotal += $totalPrice;

                    $orderItem = OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'quantity' => $itemData['quantity'],
                        'unit_price' => $product->price,
                        'total_price' => $totalPrice,
                    ]);

                    if (!empty($itemData['gift_message'])) {
                        DB::table('gift_messages')->insert([
                            'order_id' => $order->id,
                            'order_item_id' => $orderItem->id,
                            'sender_name' => 'مسودة',
                            'message' => $itemData['gift_message'],
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                }
                $order->subtotal = $subtotal;
            }

            // Update simple fields
            $fillable = ['delivery_type', 'delivery_speed', 'delivery_date', 'delivery_fee', 'payment_method', 'notes', 'address_id'];
            foreach ($fillable as $field) {
                if (array_key_exists($field, $validated)) {
                    $order->$field = $validated[$field];
                }
            }
            if (array_key_exists('scheduled_time', $validated)) {
                $order->delivery_time_slot = $validated['scheduled_time'];
            }

            // Address handling
            if (isset($validated['address']) && $order->delivery_type === 'local' && empty($validated['address_id']) && $order->customer_id) {
                $addrData = $validated['address'];
                $address = Address::create([
                    'user_id' => $order->customer_id,
                    'name' => 'العنوان (مسودة)',
                    'recipient_name' => $order->owner_name,
                    'recipient_phone' => $validated['customer_phone'] ?? '',
                    'city' => $addrData['city'] ?? 'الأحساء',
                    'street_address' => $addrData['street_address'] ?? '',
                    'latitude' => $addrData['latitude'] ?? null,
                    'longitude' => $addrData['longitude'] ?? null,
                    'google_maps_link' => $addrData['google_maps_link'] ?? null,
                    'is_default' => true
                ]);
                $order->address_id = $address->id;
            }

            $order->total = $order->subtotal + ($order->delivery_fee ?? 0);
            $order->save();

            return response()->json(['message' => 'تم التحديث بنجاح', 'order' => $order->load('items.product')]);
        });
    }

    // ADMIN: Direct Manual Checkout
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'customer_phone' => 'required|string',
            'customer_name' => 'nullable|string',
            'address' => 'nullable|array', 
            'address_id' => 'nullable|exists:addresses,id',
            'delivery_type' => 'required|in:local,pickup',
            'delivery_speed' => 'nullable|in:standard,express',
            'delivery_fee' => 'required|numeric|min:0',
            'delivery_date' => 'nullable|date',
            'scheduled_time' => 'nullable|string',
            'payment_method' => 'required|in:cash_on_delivery,bank_transfer',
            'payment_status' => 'required|in:pending,paid',
            'notes' => 'nullable|string',
            
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.gift_message' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $admin = $request->user();

            $phone = PhoneUtils::normalize($validated['customer_phone']);

            $customer = User::where('phone', $phone)->first();
            if (!$customer) {
                $customer = User::create([
                    'name' => $validated['customer_name'] ?? 'عميل لافندر',
                    'phone' => $phone,
                    'role' => 'customer',
                    'is_active' => true,
                    'password' => Hash::make(Str::random(12)) 
                ]);
            }

            $address = null;
            if ($validated['delivery_type'] === 'local') {
                if (!empty($validated['address_id'])) {
                    $address = Address::find($validated['address_id']);
                } elseif (!empty($validated['address'])) {
                    $addrData = $validated['address'];
                    $address = Address::create([
                        'user_id' => $customer->id,
                        'name' => 'المنزل',
                        'recipient_name' => $customer->name,
                        'recipient_phone' => $customer->phone,
                        'city' => $addrData['city'] ?? 'الأحساء',
                        'street_address' => $addrData['street_address'] ?? '',
                        'latitude' => $addrData['latitude'] ?? null,
                        'longitude' => $addrData['longitude'] ?? null,
                        'google_maps_link' => $addrData['google_maps_link'] ?? null,
                        'is_default' => true
                    ]);
                }
            }

            $subtotal = 0;
            $orderItemsData = [];
            $componentsToDeduct = [];

            foreach ($validated['items'] as $item) {
                $product = Product::with('components')->findOrFail($item['product_id']);
                $totalPrice = $product->price * $item['quantity'];
                $subtotal += $totalPrice;

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'total_price' => $totalPrice,
                    'gift_message' => $item['gift_message'] ?? null
                ];

                foreach ($product->components as $component) {
                    $needed = $component->pivot->quantity * $item['quantity'];
                    $componentsToDeduct[$component->id] = ($componentsToDeduct[$component->id] ?? 0) + $needed;
                }
            }

            foreach ($componentsToDeduct as $componentId => $qty) {
                $component = Component::find($componentId);
                if (!$component || $component->stock_quantity < $qty) {
                    throw ValidationException::withMessages(['items' => "الكمية المطلوبة من أحد المنتجات غير متوفرة."]);
                }
            }

            $scheduledAt = null;
            $readyBy = null;
            if (!empty($validated['delivery_date']) && !empty($validated['scheduled_time'])) {
                $scheduledAt = \Carbon\Carbon::parse($validated['delivery_date'] . ' ' . $validated['scheduled_time']);
                if ($validated['delivery_type'] === 'local') {
                    $readyBy = $scheduledAt->copy()->subMinutes(30);
                } else {
                    $readyBy = $scheduledAt->copy();
                }
            }

            $total = $subtotal + $validated['delivery_fee'];
            $status = $validated['payment_status'] === 'paid' ? 'confirmed' : 'pending';

            $order = Order::create([
                'order_number' => 'LF-' . date('Ymd') . '-' . rand(1000, 9999),
                'customer_id' => $customer->id,
                'owner_name' => $customer->name,
                'owner_phone' => $phone,
                'status' => $status,
                'is_draft' => false,
                'delivery_type' => $validated['delivery_type'],
                'delivery_speed' => $validated['delivery_speed'] ?? 'standard',
                'address_id' => $address ? $address->id : null,
                'delivery_date' => $validated['delivery_date'] ?? null,
                'scheduled_at' => $scheduledAt,
                'ready_by' => $readyBy,
                'delivery_fee' => $validated['delivery_fee'],
                'subtotal' => $subtotal,
                'discount' => 0,
                'total' => $total,
                'payment_method' => $validated['payment_method'],
                'payment_status' => $validated['payment_status'],
                'notes' => $validated['notes'] ?? null
            ]);

            foreach ($orderItemsData as $itemData) {
                $gm = $itemData['gift_message'];
                unset($itemData['gift_message']);
                $itemData['order_id'] = $order->id;
                $orderItem = OrderItem::create($itemData);

                if ($gm) {
                    DB::table('gift_messages')->insert([
                        'order_id' => $order->id,
                        'order_item_id' => $orderItem->id,
                        'sender_name' => $customer->name,
                        'message' => $gm,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            foreach ($componentsToDeduct as $componentId => $qty) {
                $comp = Component::find($componentId);
                if ($comp) {
                    $comp->decrement('stock_quantity', $qty);
                }
            }

            ActivityLog::create([
                'event_type' => 'created',
                'actor_type' => 'admin',
                'actor_id' => $admin->id,
                'subject_type' => Order::class,
                'subject_id' => $order->id,
                'description' => "المشرف {$admin->name} قام بإنشاء الطلب يدوياً للعميل {$customer->name}",
                'ip_address' => $request->ip()
            ]);

            // Notify admins via Telegram
            try {
                TelegramWebhookController::notifyAdminsNewOrder($order);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to notify admins via Telegram (manual order)', ['error' => $e->getMessage()]);
            }

            return response()->json([
                'message' => 'تم إنشاء الطلب بنجاح',
                'order' => $order
            ], 201);
        });
    }
}
