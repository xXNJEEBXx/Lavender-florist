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
        
        $order = Order::with(['items.product.primaryImage', 'driver'])
                      ->where('customer_id', $customer->id)
                      ->where('order_number', $order_number)
                      ->firstOrFail();

        return response()->json($order);
    }

    public function uploadReceipt(Request $request, $order_number)
    {
        $customer = $request->user();
        
        $order = Order::where('customer_id', $customer->id)
                      ->where('order_number', $order_number)
                      ->firstOrFail();

        if ($order->payment_method !== 'bank_transfer') {
            throw ValidationException::withMessages(['receipt' => 'هذا الطلب لا يتطلب تحويل بنكي']);
        }

        $request->validate([
            'receipt' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
            'justification' => 'nullable|string|max:1000'
        ]);

        if (!$request->hasFile('receipt') && empty($request->justification)) {
            throw ValidationException::withMessages(['receipt' => 'يجب إرفاق الإيصال أو كتابة مبرر التحويل']);
        }

        if ($request->hasFile('receipt')) {
            // Delete old receipt if exists
            if ($order->bank_transfer_receipt) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $order->bank_transfer_receipt));
            }

            $path = $request->file('receipt')->store('receipts', 'public');
            $order->bank_transfer_receipt = '/storage/' . $path;
        }

        if ($request->filled('justification')) {
            $order->notes = $order->notes . "\n\nمبرر التحويل: " . $request->justification;
        }

        $order->save();

        return response()->json([
            'message' => 'تم استلام معلومات التحويل بنجاح. جاري مراجعة الطلب.',
            'order' => $order
        ]);
    }
}
