<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    public function status(Request $request)
    {
        // Get orders currently in the prep queue
        $activeOrders = Order::with('items.product')
            ->whereIn('status', ['pending', 'preparing'])
            ->get();

        $totalQueueTimeMinutes = 0;

        foreach ($activeOrders as $order) {
            $orderBaseTime = 0;
            // Calculate base prep time for this order
            foreach ($order->items as $item) {
                if ($item->product) {
                    $orderBaseTime += ($item->product->preparation_time_minutes * $item->quantity);
                }
            }

            // Calculate elapsed time in minutes since order was placed
            $elapsedMinutes = $order->created_at->diffInMinutes(Carbon::now());
            
            // Remaining time is base time minus elapsed time (minimum 0)
            $remainingTime = max(0, $orderBaseTime - $elapsedMinutes);
            
            $totalQueueTimeMinutes += $remainingTime;
        }

        return response()->json([
            'queue_time_minutes' => $totalQueueTimeMinutes,
        ]);
    }
}
