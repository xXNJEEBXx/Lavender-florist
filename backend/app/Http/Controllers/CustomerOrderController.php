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
            'receipt' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120' // 5MB Max
        ]);

        if ($request->hasFile('receipt')) {
            // Delete old receipt if exists
            if ($order->bank_transfer_receipt) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $order->bank_transfer_receipt));
            }

            $path = $request->file('receipt')->store('receipts', 'public');
            $order->bank_transfer_receipt = '/storage/' . $path;
            $order->save();

            return response()->json([
                'message' => 'تم رفع الإيصال بنجاح. جاري مراجعة الطلب.',
                'order' => $order
            ]);
        }

        throw ValidationException::withMessages(['receipt' => 'فشل رفع الإيصال']);
    }
}
