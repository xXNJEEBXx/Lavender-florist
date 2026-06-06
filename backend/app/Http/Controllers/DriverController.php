<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Driver;

class DriverController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Driver::orderBy('is_primary', 'desc')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'telegram_username' => 'nullable|string|max:255',
            'is_primary' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if (!empty($validated['is_primary'])) {
            // Unset other primary drivers
            Driver::where('is_primary', true)->update(['is_primary' => false]);
        }

        $driver = Driver::create($validated);
        return response()->json($driver, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Driver $driver)
    {
        return $driver;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Driver $driver)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'phone' => 'string|max:255',
            'telegram_username' => 'nullable|string|max:255',
            'is_primary' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['is_primary']) && $validated['is_primary']) {
            Driver::where('id', '!=', $driver->id)->update(['is_primary' => false]);
        }

        $driver->update($validated);
        return response()->json($driver);
    }

    /**
     * Pay dues to the driver and notify them via Telegram.
     */
    public function payDues(Request $request, Driver $driver, \App\Services\TelegramService $telegram)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        $amount = $validated['amount'];
        
        if ($amount > $driver->balance) {
            return response()->json(['message' => 'Amount exceeds driver balance.'], 422);
        }

        $driver->update([
            'balance' => $driver->balance - $amount
        ]);

        if ($driver->telegram_chat_id) {
            $message = "💸 <b>إشعار سداد مستحقات</b>\n\n";
            $message .= "تم سداد مبلغ: <b>{$amount} ر.س</b> لك.\n";
            $message .= "الرصيد المتبقي لك: <b>{$driver->balance} ر.س</b>\n\n";
            $message .= "شكراً لجهودك المستمرة! 🌸";
            
            try {
                $telegram->sendMessage($driver->telegram_chat_id, $message);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send telegram payment msg: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Dues settled successfully.',
            'driver' => $driver
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Driver $driver)
    {
        $driver->delete();
        return response()->json(null, 204);
    }
}
