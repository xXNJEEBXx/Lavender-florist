<?php

namespace App\Http\Controllers;

use App\Models\AdminBreak;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminBreakController extends Controller
{
    public function index()
    {
        return AdminBreak::with('creator:id,name')
            ->where('end_at', '>=', Carbon::now())
            ->orderBy('start_at')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'start_at' => 'required|date|after:now',
            'end_at' => 'required|date|after:start_at',
            'reason' => 'nullable|string|max:255',
        ]);

        // Check for conflicting scheduled orders
        $conflictingOrders = Order::whereNotNull('scheduled_at')
            ->whereIn('status', ['pending', 'preparing'])
            ->where('scheduled_at', '>=', $validated['start_at'])
            ->where('scheduled_at', '<=', $validated['end_at'])
            ->with('customer:id,name')
            ->get();

        $break = AdminBreak::create([
            ...$validated,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'break' => $break,
            'conflicting_orders' => $conflictingOrders,
            'has_conflicts' => $conflictingOrders->isNotEmpty(),
            'message' => $conflictingOrders->isNotEmpty()
                ? 'تم إنشاء الإجازة ⚠️ تنبيه: يوجد ' . $conflictingOrders->count() . ' طلب مجدول خلال هذه الفترة!'
                : 'تم إنشاء الإجازة بنجاح.',
        ], 201);
    }

    public function destroy(AdminBreak $break)
    {
        $break->delete();
        return response()->json(null, 204);
    }
}
