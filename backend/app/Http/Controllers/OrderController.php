<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use App\Models\Driver;
use App\Jobs\AssignToBackupDrivers;
use App\Services\TelegramService;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Order::with(['customer', 'items.product.primaryImage', 'items.giftMessage', 'address', 'driver'])->latest();

        // Optional filtering by status
        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'incomplete') {
                $query->whereNotIn('status', ['delivered', 'cancelled']);
            } else {
                $query->where('status', $request->status);
            }
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order)
    {
        $order->load(['customer', 'items.product.primaryImage', 'items.giftMessage', 'address', 'driver', 'statusHistory']);
        return response()->json($order);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'sometimes|in:pending,preparing,ready,delivering,delivered,cancelled',
            'payment_status' => 'sometimes|in:pending,paid,refunded'
        ]);

        if ($request->has('status')) {
            $order->status = $request->status;
        }

        if ($request->has('payment_status')) {
            $order->payment_status = $request->payment_status;
        }

        $order->save();

        $user = Auth::user();
        $actorName = $user ? $user->name : 'النظام';
        
        $statusesAr = [
            'pending' => 'بانتظار الدفع',
            'preparing' => 'قيد التجهيز',
            'ready' => 'جاهز للاستلام',
            'delivering' => 'جاري التوصيل',
            'delivered' => 'مكتمل',
            'cancelled' => 'ملغي'
        ];
        $statusStr = $request->status ? ($statusesAr[$request->status] ?? $request->status) : 'تحديث';

        ActivityLog::create([
            'event_type' => 'updated',
            'actor_type' => 'admin',
            'actor_id' => $user->id ?? 1,
            'subject_type' => Order::class,
            'subject_id' => $order->id,
            'description' => 'المشرف ' . $actorName . ' قام بتحديث حالة الطلب #' . $order->order_number . ' إلى: ' . $statusStr,
            'ip_address' => $request->ip()
        ]);

        return response()->json([
            'message' => 'تم تحديث حالة الطلب بنجاح',
            'order' => $order->load(['customer', 'items.product', 'address'])
        ]);
    }

    /**
     * Verify payment and start preparing the order.
     */
    public function verifyPayment(Order $order)
    {
        if ($order->payment_method !== 'bank_transfer') {
            throw ValidationException::withMessages(['payment' => 'هذا الطلب ليس تحويلاً بنكياً']);
        }

        if (!$order->bank_transfer_receipt) {
            throw ValidationException::withMessages(['payment' => 'لا يوجد إيصال مرفق للمراجعة']);
        }

        $order->payment_status = 'paid';
        // Auto transition to preparing if it was pending
        if ($order->status === 'pending') {
            $order->status = 'preparing';
        }
        $order->save();

        $user = Auth::user();
        $actorName = $user ? $user->name : 'النظام';

        ActivityLog::create([
            'event_type' => 'updated',
            'actor_type' => 'admin',
            'actor_id' => $user->id ?? 1,
            'subject_type' => Order::class,
            'subject_id' => $order->id,
            'description' => 'المشرف ' . $actorName . ' قام بتأكيد الدفع للطلب #' . $order->order_number,
            'ip_address' => request()->ip()
        ]);

        return response()->json([
            'message' => 'تم تأكيد الدفع والبدء بتجهيز الطلب بنجاح',
            'order' => $order->load(['customer', 'items.product', 'address'])
        ]);
    }

    public function sendToDelivery(Request $request, Order $order, TelegramService $telegram)
    {
        $validated = $request->validate([
            'skip_primary' => 'boolean'
        ]);

        if ($order->status !== 'ready') {
            $order->update(['status' => 'ready', 'ready_at' => now()]);
        }

        $skipPrimary = $validated['skip_primary'] ?? false;
        
        $order->update(['delivery_offered_at' => now()]);

        if ($skipPrimary) {
            // Dispatch immediately to backups
            AssignToBackupDrivers::dispatch($order);
            return response()->json(['message' => 'تم تخطي الأساسي وإرسال الطلب للمناديب الاحتياطيين.']);
        } else {
            // Send to primary
            $primaryDriver = Driver::where('is_primary', true)->where('is_active', true)->whereNotNull('telegram_chat_id')->first();
            
            if (!$primaryDriver) {
                // No primary driver, send to backups immediately
                AssignToBackupDrivers::dispatch($order);
                return response()->json(['message' => 'لا يوجد مندوب أساسي مسجل، تم تحويل الطلب للمناديب الاحتياطيين.']);
            }

            $address = $order->address;
            $storeLocationUrl = "https://maps.google.com/?q=Lavender+Florist";

            $minutes = $order->delivery_minutes ? $order->delivery_minutes . ' دقيقة' : 'غير محدد';
            
            $messageText = "🚨 <b>طلب توصيل جديد!</b> 🚨\n\n";
            $messageText .= "📦 <b>رقم الطلب:</b> {$order->order_number}\n";
            $messageText .= "📍 <b>المدينة/الحي:</b> {$address->city} - {$address->street}\n";
            $messageText .= "💸 <b>مبلغ التوصيل:</b> {$order->delivery_fee} ريال\n";
            $messageText .= "⏱️ <b>المسافة تقريباً:</b> {$minutes}\n\n";

            if ($order->address && $order->address->delivery_notes) {
                $messageText .= "📝 <b>ملاحظات إضافية للتوصيل:</b>\n" . e($order->address->delivery_notes) . "\n\n";
            }

            $messageText .= "🏪 <b>نقطة الاستلام:</b> <a href=\"{$storeLocationUrl}\">موقع المتجر (لافندر فلوريست)</a>\n";

            $replyMarkup = [
                'inline_keyboard' => [
                    [
                        ['text' => '✅ قبول الطلب', 'callback_data' => "accept_order_{$order->id}"]
                    ]
                ]
            ];

            $telegram->sendMessage($primaryDriver->telegram_chat_id, $messageText, $replyMarkup);

            // Schedule the job for backup drivers after 5 minutes silently
            AssignToBackupDrivers::dispatch($order)->delay(now()->addMinutes(5));

            return response()->json(['message' => 'تم إرسال الطلب للمندوب بنجاح.']);
        }
    }

    /**
     * Fully update the specified order (Admin edit).
     */
    public function fullUpdate(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,preparing,ready,delivering,delivered,cancelled',
            'delivery_type' => 'required|in:local,shipping,pickup',
            'delivery_fee' => 'required|numeric|min:0',
            'delivery_date' => 'nullable|date',
            'delivery_time_slot' => 'nullable|in:morning,afternoon,evening',
            'estimated_preparation_time' => 'required|integer|min:0',
            'driver_notes' => 'nullable|string',
            'subtotal' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash_on_delivery,bank_transfer',
            'payment_status' => 'required|in:pending,paid,refunded',
            'notes' => 'nullable|string',
            'address' => 'nullable|array',
            'address.city' => 'nullable|string',
            'address.district' => 'nullable|string',
            'address.street' => 'nullable|string',
            'address.recipient_name' => 'nullable|string',
            'address.recipient_phone' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.gift_message' => 'nullable|string'
        ]);

        \DB::transaction(function () use ($validated, $order, $request) {
            // Update Address if local
            if ($validated['delivery_type'] === 'local' && !empty($validated['address'])) {
                if ($order->address_id) {
                    $order->address()->update($validated['address']);
                } else {
                    $address = \App\Models\Address::create($validated['address']);
                    $order->address_id = $address->id;
                }
            }

            // Update basic order fields
            $order->update([
                'status' => $validated['status'],
                'delivery_type' => $validated['delivery_type'],
                'delivery_fee' => $validated['delivery_fee'],
                'delivery_date' => $validated['delivery_date'] ?? null,
                'delivery_time_slot' => $validated['delivery_time_slot'] ?? null,
                'estimated_preparation_time' => $validated['estimated_preparation_time'],
                'driver_notes' => $validated['driver_notes'] ?? null,
                'subtotal' => $validated['subtotal'],
                'total' => $validated['total'],
                'payment_method' => $validated['payment_method'],
                'payment_status' => $validated['payment_status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Sync items
            $order->items()->delete();
            
            foreach ($validated['items'] as $itemData) {
                $orderItem = $order->items()->create([
                    'product_id' => $itemData['product_id'],
                    'product_name' => \App\Models\Product::find($itemData['product_id'])->name,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $itemData['quantity'] * $itemData['unit_price']
                ]);

                if (!empty($itemData['gift_message'])) {
                    \DB::table('gift_messages')->insert([
                        'order_id' => $order->id,
                        'order_item_id' => $orderItem->id,
                        'message' => $itemData['gift_message'],
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            $user = \Auth::user();
            \App\Models\ActivityLog::create([
                'event_type' => 'updated',
                'actor_type' => 'admin',
                'actor_id' => $user->id ?? 1,
                'subject_type' => \App\Models\Order::class,
                'subject_id' => $order->id,
                'description' => 'تم تعديل جميع تفاصيل الطلب #' . $order->order_number . ' من قبل المشرف ' . ($user->name ?? 'النظام'),
                'ip_address' => $request->ip()
            ]);
        });

        return response()->json([
            'message' => 'تم تحديث الطلب بالكامل بنجاح',
            'order' => $order->fresh(['customer', 'items.product.primaryImage', 'items.giftMessage', 'address', 'driver', 'statusHistory'])
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order)
    {
        $order->delete();
        return response()->json(['message' => 'تم حذف الطلب']);
    }
}
