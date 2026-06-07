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
            ->where(function ($query) {
                $query->whereNull('ready_by')
                      ->orWhere('ready_by', '<=', Carbon::now()->addMinutes(60));
            })
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

        $prepMinutes = (int) $request->query('prep_minutes', 0);
        $deliveryType = $request->query('delivery_type', 'pickup');
        $deliverySpeed = $request->query('delivery_speed', 'standard');

        $deliveryTimeAdded = 0;
        if ($deliveryType === 'local') {
            $deliveryTimeAdded = $deliverySpeed === 'express' ? 60 : 240;
        }

        $totalLeadMinutes = $totalQueueTimeMinutes + $prepMinutes + $deliveryTimeAdded;
        $minReadyAt = Carbon::now()->addMinutes($totalLeadMinutes);

        $now = Carbon::now();
        $dateStr = $now->format('Y-m-d');
        $dayOfWeek = $now->dayOfWeek;

        $isClosed = \App\Models\WorkingHours::whereIn('type', ['closure', 'holiday'])
            ->where('is_active', true)
            ->where('date', $dateStr)
            ->exists();

        $wh = \App\Models\WorkingHours::where('type', 'regular')
            ->where('is_active', true)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        $isAsapAvailable = true;
        if ($isClosed || !$wh || !$wh->open_time || !$wh->close_time) {
            $isAsapAvailable = false;
        } else {
            $openTime = Carbon::parse($dateStr . ' ' . $wh->open_time);
            $closeTime = Carbon::parse($dateStr . ' ' . $wh->close_time);

            if ($now->lt($openTime) || $minReadyAt->gt($closeTime)) {
                $isAsapAvailable = false;
            } else {
                $breaks = \App\Models\AdminBreak::where('end_at', '>', $now)
                    ->where('start_at', '<', $minReadyAt)
                    ->exists();
                
                if ($breaks) {
                    $isAsapAvailable = false;
                }
            }
        }

        return response()->json([
            'queue_time_minutes' => $totalQueueTimeMinutes,
            'is_asap_available' => $isAsapAvailable
        ]);
    }
}
