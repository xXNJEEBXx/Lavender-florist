<?php

namespace App\Http\Controllers;

use App\Models\WorkingHours;
use App\Models\AdminBreak;
use App\Models\Order;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    /**
     * Get available time slots for the next 30 days.
     * Considers: working hours, admin breaks, queue time, prep time, delivery time.
     */
    public function availableSlots(Request $request)
    {
        $prepMinutes = (int) $request->query('prep_minutes', 30);
        $deliveryType = $request->query('delivery_type', 'pickup');
        $deliverySpeed = $request->query('delivery_speed', 'standard');

        // 1. Calculate minimum ready time from NOW
        $queueMinutes = $this->getQueueMinutes();

        // Delivery time added to the total
        $deliveryTimeAdded = 0;
        if ($deliveryType === 'local') {
            $deliveryTimeAdded = $deliverySpeed === 'express' ? 60 : 45;
        }

        $totalLeadMinutes = $queueMinutes + $prepMinutes + $deliveryTimeAdded;
        $minReadyAt = Carbon::now('Asia/Riyadh')->addMinutes($totalLeadMinutes);

        // 2. Get working hours (regular schedule)
        $regularHours = WorkingHours::where('type', 'regular')
            ->where('is_active', true)
            ->get()
            ->keyBy('day_of_week');

        // 3. Get closures/holidays for the next 30 days
        $startDate = Carbon::today('Asia/Riyadh');
        $endDate = Carbon::today('Asia/Riyadh')->addDays(30);

        $closures = WorkingHours::whereIn('type', ['closure', 'holiday'])
            ->where('is_active', true)
            ->whereBetween('date', [$startDate, $endDate])
            ->get()
            ->pluck('date')
            ->map(fn($d) => $d->format('Y-m-d'))
            ->toArray();

        // 4. Get admin breaks for the next 30 days
        $breaks = AdminBreak::where('end_at', '>=', $startDate)
            ->where('start_at', '<=', $endDate->copy()->endOfDay())
            ->get();

        // 5. Calculate scheduled orders capacity
        $scheduledOrders = Order::with('items.product')
            ->whereIn('status', ['pending', 'preparing'])
            ->whereNotNull('ready_by')
            ->whereBetween('ready_by', [$startDate, $endDate->copy()->endOfDay()])
            ->get();

        $ordersByDate = [];
        foreach ($scheduledOrders as $order) {
            $prep = 0;
            if ($order->estimated_preparation_time) {
                $prep = $order->estimated_preparation_time;
            } else {
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $prep += ($item->product->preparation_time_minutes * $item->quantity);
                    }
                }
            }
            $readyByRiyadh = Carbon::parse($order->ready_by, 'Asia/Riyadh');
            $dStr = $readyByRiyadh->format('Y-m-d');
            if (!isset($ordersByDate[$dStr])) {
                $ordersByDate[$dStr] = [];
            }
            $ordersByDate[$dStr][] = [
                'ready_by' => $readyByRiyadh,
                'prep_minutes' => $prep
            ];
        }

        // 6. Generate slots for each day
        $dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

        $availableDays = [];

        $period = CarbonPeriod::create($startDate, $endDate);

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');

            // Skip closed days
            if (in_array($dateStr, $closures)) {
                continue;
            }

            // Get working hours for this day of week (Carbon: 0=Sunday)
            $dayOfWeek = $date->dayOfWeek;
            $wh = $regularHours->get($dayOfWeek);

            if (!$wh || !$wh->open_time || !$wh->close_time) {
                continue; // No working hours for this day = day off
            }

            $openTime = Carbon::parse($dateStr . ' ' . $wh->open_time, 'Asia/Riyadh');
            $closeTime = Carbon::parse($dateStr . ' ' . $wh->close_time, 'Asia/Riyadh');

            if ($closeTime->lte($openTime)) {
                $closeTime->addDay();
            }

            // Generate 30-minute slots
            $slots = [];
            $slotTime = $openTime->copy();

            while ($slotTime->lt($closeTime)) {
                $slotEnd = $slotTime->copy()->addMinutes(30);

                // Skip if slot is before absolute minimum ready time from now
                if ($slotTime->lt($minReadyAt)) {
                    $slotTime = $slotEnd;
                    continue;
                }

                // Skip if slot is too early in the day (before store opens + prep + delivery)
                $slotMinTimeForDay = $openTime->copy()->addMinutes($prepMinutes + $deliveryTimeAdded);
                if ($slotTime->lt($slotMinTimeForDay)) {
                    $slotTime = $slotEnd;
                    continue;
                }

                // Check Florist Capacity for this slot (30 mins max prep time per slot)
                $slotOrdersPrepTime = 0;
                if (isset($ordersByDate[$dateStr])) {
                    foreach ($ordersByDate[$dateStr] as $o) {
                        if ($o['ready_by']->gt($slotTime) && $o['ready_by']->lte($slotEnd)) {
                            $slotOrdersPrepTime += $o['prep_minutes'];
                        }
                    }
                }

                if ($slotOrdersPrepTime >= 30) {
                    $slotTime = $slotEnd;
                    continue; // Florist is already fully booked for this slot
                }

                // Skip if slot overlaps with any admin break
                $isInBreak = false;
                foreach ($breaks as $brk) {
                    if ($slotTime->lt($brk->end_at) && $slotEnd->gt($brk->start_at)) {
                        $isInBreak = true;
                        break;
                    }
                }

                if (!$isInBreak) {
                    $slots[] = $slotTime->format('H:i');
                }

                $slotTime = $slotEnd;
            }

            if (!empty($slots)) {
                $availableDays[] = [
                    'date' => $dateStr,
                    'day_name' => $dayNames[$dayOfWeek],
                    'slots' => $slots,
                ];
            }
        }

        return response()->json([
            'min_ready_at' => $minReadyAt->toIso8601String(),
            'total_lead_minutes' => $totalLeadMinutes,
            'available_days' => $availableDays,
        ]);
    }

    /**
     * Calculate current queue time in minutes (same logic as QueueController).
     */
    private function getQueueMinutes(): int
    {
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
            foreach ($order->items as $item) {
                if ($item->product) {
                    $orderBaseTime += ($item->product->preparation_time_minutes * $item->quantity);
                }
            }
            $elapsedMinutes = $order->created_at->diffInMinutes(Carbon::now());
            $remainingTime = max(0, $orderBaseTime - $elapsedMinutes);
            $totalQueueTimeMinutes += $remainingTime;
        }

        return $totalQueueTimeMinutes;
    }
}
