<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Utils\PhoneUtils;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SharedOrderController extends Controller
{
    public function getSharedOrder($token)
    {
        $order = Order::where('token', $token)->where('is_draft', true)->with(['items.product.images', 'address'])->first();
        if (!$order) {
            return response()->json(['message' => 'الرابط غير صالح أو تم اكتمال الطلب'], 404);
        }

        // Format for cart
        $cartItems = $order->items->map(function ($item) {
            $product = $item->product;
            $primaryImage = $product->images->where('is_primary', true)->first();
            $productData = $product->toArray();
            $productData['primary_image_url'] = $primaryImage ? '/storage/' . $primaryImage->image_url : null;

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'gift_message' => $item->gift_message,
                'unit_price' => $item->unit_price,
                'total_price' => $item->total_price,
                'product' => $productData,
            ];
        });

        return response()->json([
            'order' => $order,
            'cart' => [
                'items' => $cartItems,
                'subtotal' => $order->subtotal,
                'delivery_fee' => $order->delivery_fee,
                'total' => $order->total,
            ]
        ]);
    }

    public function updateItems(Request $request, $token)
    {
        $order = Order::where('token', $token)->where('is_draft', true)->first();
        if (!$order) return response()->json(['message' => 'Not found'], 404);

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.gift_message' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($validated, $order) {
            // Delete old items
            $order->items()->delete();

            $subtotal = 0;
            foreach ($validated['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                $totalPrice = $product->price * $itemData['quantity'];
                $subtotal += $totalPrice;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $product->price,
                    'total_price' => $totalPrice,
                    'gift_message' => $itemData['gift_message'] ?? null,
                ]);
            }

            $order->subtotal = $subtotal;
            $order->total = $subtotal + $order->delivery_fee;
            $order->save();

            return response()->json(['message' => 'تم التحديث بنجاح', 'order' => $order]);
        });
    }

    public function checkout(Request $request, $token)
    {
        $order = Order::where('token', $token)->where('is_draft', true)->first();
        if (!$order) return response()->json(['message' => 'Not found'], 404);

        $validated = $request->validate([
            'customer_name' => 'nullable|string',
            'customer_phone' => 'required|string',
            'payment_method' => 'required|string',
            'delivery_fee' => 'nullable|numeric',
            'delivery_minutes' => 'nullable|numeric',
            'address_id' => 'nullable|exists:addresses,id'
        ]);

        $order->owner_name = $validated['customer_name'] ?? $order->owner_name;
        
        $phone = PhoneUtils::normalize($validated['customer_phone']);
        $order->owner_phone = $phone;
        
        // Find or create customer if not set
        if (!$order->customer_id && $phone) {
            $customer = \App\Models\User::where('phone', $phone)->first();
            if (!$customer) {
                $customer = \App\Models\User::create([
                    'name' => $order->owner_name ?: 'عميل مسودة',
                    'phone' => $phone,
                    'password' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(10)),
                    'role' => 'customer'
                ]);
            }
            $order->customer_id = $customer->id;
        }

        $order->payment_method = $validated['payment_method'];
        $order->is_draft = false;
        $order->status = 'pending';
        $order->token = null;
        
        if (isset($validated['address_id'])) {
            $order->address_id = $validated['address_id'];
        } else if ($request->has('address') && $request->input('address')) {
            $addressData = $request->input('address');
            $newAddress = \App\Models\Address::create([
                'user_id' => $order->customer_id,
                'name' => $addressData['name'] ?? 'العنوان',
                'recipient_name' => $addressData['recipient_name'] ?? $order->owner_name,
                'recipient_phone' => $addressData['recipient_phone'] ?? $order->owner_phone ?? $phone,
                'city' => $addressData['city'] ?? 'الأحساء',
                'street_address' => $addressData['street_address'] ?? '',
                'latitude' => $addressData['latitude'] ?? null,
                'longitude' => $addressData['longitude'] ?? null,
                'google_maps_link' => $addressData['google_maps_link'] ?? null,
                'delivery_notes' => $addressData['delivery_notes'] ?? null,
                'is_default' => true,
            ]);
            $order->address_id = $newAddress->id;
        }
        
        if (isset($validated['delivery_fee'])) {
            $order->delivery_fee = $validated['delivery_fee'];
            $order->total = $order->subtotal + $order->delivery_fee;
        }
        if (isset($validated['delivery_minutes'])) {
            $order->delivery_minutes = $validated['delivery_minutes'];
        }

        $order->save();

        // Notify admins via Telegram
        if ($order->payment_method !== 'bank_transfer') {
            try {
                TelegramWebhookController::notifyAdminsNewOrder($order);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to notify admins via Telegram (shared order)', ['error' => $e->getMessage()]);
            }
        }

        $tokenStr = null;
        if ($order->customer_id) {
            $customer = \App\Models\User::find($order->customer_id);
            if ($customer) {
                $tokenStr = $customer->createToken('auth_token')->plainTextToken;
            }
        }

        return response()->json([
            'message' => 'تم تأكيد الطلب بنجاح',
            'order' => $order,
            'token' => $tokenStr,
            'user' => $customer ?? null
        ]);
    }
}
