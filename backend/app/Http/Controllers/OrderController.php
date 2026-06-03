<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Order::with(['customer', 'items.product', 'address'])->latest();

        // Optional filtering by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order)
    {
        $order->load(['customer', 'items.product', 'address']);
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
            'actor_type' => \App\Models\User::class,
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
            'actor_type' => \App\Models\User::class,
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

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order)
    {
        $order->delete();
        return response()->json(['message' => 'تم حذف الطلب']);
    }
}
