<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CustomerOrderController extends Controller
{
    public function show(Request $request, $order_number)
    {
        $customer = $request->user();
        $order = Order::with(['items.product.primaryImage', 'items.giftMessage', 'driver', 'address'])
                      ->where('customer_id', $customer->id)
                      ->where('order_number', $order_number)
                      ->firstOrFail();

        return response()->json($order);
    }

    public function uploadReceipt(Request $request, $order_number)
    {
        $customer = $request->user();
        
        $order = Order::with(['items.product.primaryImage', 'items.giftMessage', 'driver', 'address'])
                      ->where('customer_id', $customer->id)
                      ->where('order_number', $order_number)
                      ->firstOrFail();

        if ($order->payment_method !== 'bank_transfer') {
            throw ValidationException::withMessages(['receipt' => 'هذا الطلب لا يتطلب تحويل بنكي']);
        }

        $request->validate([
            'receipt' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
            'payment_justification' => 'nullable|string|max:2000'
        ]);

        if (!$request->hasFile('receipt') && !$request->filled('payment_justification')) {
            throw ValidationException::withMessages(['receipt' => 'الرجاء إرفاق الإيصال أو كتابة مبرر التحويل.']);
        }

        if ($request->hasFile('receipt')) {
            // Delete old receipt if exists
            if ($order->bank_transfer_receipt) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $order->bank_transfer_receipt));
            }

            $path = $request->file('receipt')->store('receipts', 'public');
            $order->bank_transfer_receipt = '/storage/' . $path;
        }

        if ($request->filled('payment_justification')) {
            $justification = "تبرير التحويل البنكي:\n" . $request->input('payment_justification');
            $order->notes = $order->notes ? $order->notes . "\n\n" . $justification : $justification;
        }

        $order->save();

        return response()->json([
            'message' => 'تم استلام بيانات التحويل بنجاح. جاري مراجعة الطلب.',
            'order' => $order
        ]);
    }
}
