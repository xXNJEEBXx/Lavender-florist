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
        $query = Order::with(['customer', 'items.product.primaryImage', 'address', 'driver'])->latest();

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
        $order->load(['customer', 'items.product', 'address', 'driver']);
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
            $mapsUrl = $address->latitude && $address->longitude 
                ? "https://maps.google.com/?q={$address->latitude},{$address->longitude}"
                : "https://maps.google.com/?q=" . urlencode($address->street);

            $minutes = $order->delivery_minutes ? $order->delivery_minutes . ' دقيقة' : 'غير محدد';
            
            $messageText = "🚨 <b>طلب توصيل جديد!</b> 🚨\n\n";
            $messageText .= "📦 <b>رقم الطلب:</b> {$order->order_number}\n";
            $messageText .= "📍 <b>المدينة/الحي:</b> {$address->city} - {$address->street}\n";
            $messageText .= "💵 <b>مبلغ التوصيل:</b> {$order->delivery_fee} ريال\n";
            $messageText .= "⏱️ <b>المسافة تقريباً:</b> {$minutes}\n\n";
            $messageText .= "🗺️ <a href=\"{$mapsUrl}\">عرض الموقع على الخريطة</a>\n";

            $replyMarkup = [
                'inline_keyboard' => [
                    [
                        ['text' => '✅ قبول واستلام الطلب', 'callback_data' => "accept_order_{$order->id}"]
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
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order)
    {
        $order->delete();
        return response()->json(['message' => 'تم حذف الطلب']);
    }
}
