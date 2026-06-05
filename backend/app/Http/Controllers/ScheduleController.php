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
            $deliveryTimeAdded = $deliverySpeed === 'express' ? 60 : 240;
        }

        $totalLeadMinutes = $queueMinutes + $prepMinutes + $deliveryTimeAdded;
        $minReadyAt = Carbon::now()->addMinutes($totalLeadMinutes);

        // 2. Get working hours (regular schedule)
        $regularHours = WorkingHours::where('type', 'regular')
            ->where('is_active', true)
            ->get()
            ->keyBy('day_of_week');

        // 3. Get closures/holidays for the next 30 days
        $startDate = Carbon::today();
        $endDate = Carbon::today()->addDays(30);

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

        // 5. Generate slots for each day
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

            $openTime = Carbon::parse($dateStr . ' ' . $wh->open_time);
            $closeTime = Carbon::parse($dateStr . ' ' . $wh->close_time);

            // Generate 30-minute slots
            $slots = [];
            $slotTime = $openTime->copy();

            while ($slotTime->lt($closeTime)) {
                $slotEnd = $slotTime->copy()->addMinutes(30);

                // Skip if slot is before minimum ready time
                if ($slotTime->lt($minReadyAt)) {
                    $slotTime = $slotEnd;
                    continue;
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
