<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Driver;
use App\Services\TelegramService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AssignToBackupDrivers implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    protected $order;

    /**
     * Create a new job instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Execute the job.
     */
    public function handle(TelegramService $telegram): void
    {
        // Refresh the order to get the latest status
        $this->order->refresh();

        // If the order has already been assigned to a driver, or is no longer ready, stop.
        if ($this->order->driver_id !== null || $this->order->status !== 'ready') {
            return;
        }

        // It's still ready, meaning the primary driver missed the 5-minute window!
        // Get all backup (active, non-primary) drivers with a telegram chat ID
        $backupDrivers = Driver::where('is_active', true)
                               ->where('is_primary', false)
                               ->whereNotNull('telegram_chat_id')
                               ->get();

        if ($backupDrivers->isEmpty()) {
            return;
        }

        $address = $this->order->address;
        $telegram = app(TelegramService::class);
        $address = $this->order->address;
        $mapsUrl = $address->latitude && $address->longitude 
            ? "https://maps.google.com/?q={$address->latitude},{$address->longitude}"
            : "https://maps.google.com/?q=" . urlencode($address->street);

        $minutes = $this->order->delivery_minutes ? $this->order->delivery_minutes . ' دقيقة' : 'غير محدد';
        
        $messageText = "🚨 <b>طلب توصيل جديد!</b> 🚨\n\n";
        $messageText .= "📦 <b>رقم الطلب:</b> {$this->order->order_number}\n";
        $messageText .= "📍 <b>المدينة/الحي:</b> {$address->city} - {$address->street}\n";
        $messageText .= "💵 <b>مبلغ التوصيل:</b> {$this->order->delivery_fee} ريال\n";
        $messageText .= "⏱️ <b>المسافة تقريباً:</b> {$minutes}\n\n";
        $messageText .= "🗺️ <a href=\"{$mapsUrl}\">عرض الموقع على الخريطة</a>\n";

        $replyMarkup = [
            'inline_keyboard' => [
                [
                    ['text' => '✅ قبول واستلام الطلب', 'callback_data' => "accept_order_{$this->order->id}"]
                ]
            ]
        ];

        // Broadcast to all backup drivers
        foreach ($backupDrivers as $driver) {
            $telegram->sendMessage($driver->telegram_chat_id, $messageText, $replyMarkup);
        }
    }
}
