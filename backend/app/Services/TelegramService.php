<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Order;
use App\Models\User;

class TelegramService
{
    protected $token;
    protected $apiUrl;

    public function __construct()
    {
        $this->token = config('app.telegram_bot_token', env('TELEGRAM_BOT_TOKEN'));
        $this->apiUrl = "https://api.telegram.org/bot{$this->token}";
    }

    public function sendMessage($chatId, $text, $replyMarkup = null)
    {
        $payload = [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
        ];

        if ($replyMarkup) {
            $payload['reply_markup'] = $replyMarkup;
        }

        return Http::post("{$this->apiUrl}/sendMessage", $payload)->json();
    }

    public function sendPhoto($chatId, $photo, $caption = null, $replyMarkup = null)
    {
        $url = "{$this->apiUrl}/sendPhoto";
        $payload = [
            'chat_id' => $chatId,
            'parse_mode' => 'HTML',
        ];

        if ($caption) {
            $payload['caption'] = $caption;
        }

        if ($replyMarkup) {
            $payload['reply_markup'] = json_encode($replyMarkup);
        }

        if (file_exists($photo)) {
            $response = Http::attach(
                'photo', file_get_contents($photo), basename($photo)
            )->post($url, $payload);
            return $response->json();
        }

        $payload['photo'] = $photo;
        $response = Http::post($url, $payload);
        
        if (!$response->successful()) {
            \Illuminate\Support\Facades\Log::error('Telegram sendPhoto failed', [
                'status' => $response->status(),
                'response' => $response->json(),
                'payload' => $payload,
            ]);
        }
        
        return $response->json();
    }

    public function editMessageText($chatId, $messageId, $text, $replyMarkup = null)
    {
        $payload = [
            'chat_id' => $chatId,
            'message_id' => $messageId,
            'text' => $text,
            'parse_mode' => 'HTML',
        ];

        if ($replyMarkup !== false) {
            $payload['reply_markup'] = $replyMarkup; // If null, it removes the keyboard. If false, ignores it.
        }

        $response = Http::post("{$this->apiUrl}/editMessageText", $payload);
        if (!$response->successful()) {
            \Illuminate\Support\Facades\Log::error('Telegram editMessageText failed', [
                'status' => $response->status(),
                'response' => $response->json(),
                'payload' => $payload,
            ]);
        }
        return $response->json();
    }

    public function answerCallbackQuery($callbackQueryId, $text = null, $showAlert = false)
    {
        $payload = [
            'callback_query_id' => $callbackQueryId,
        ];

        if ($text) {
            $payload['text'] = $text;
            $payload['show_alert'] = $showAlert;
        }

        return Http::post("{$this->apiUrl}/answerCallbackQuery", $payload)->json();
    }

    public function getFileUrl($fileId)
    {
        $response = Http::get("{$this->apiUrl}/getFile", ['file_id' => $fileId]);
        if ($response->successful()) {
            $path = $response->json()['result']['file_path'] ?? null;
            if ($path) {
                return "https://api.telegram.org/file/bot{$this->token}/{$path}";
            }
        }
        return null;
    }

    public function notifyNewOrder(Order $order)
    {
        $admins = User::where('role', 'admin')
            ->whereNotNull('telegram_chat_id')
            ->where('telegram_notify_new_orders', true)
            ->get();

        if ($admins->isEmpty()) return;

        $order->load(['items.product', 'address', 'customer']);

        $customerName = $order->owner_name ?: ($order->customer->name ?? ($order->address->recipient_name ?? 'غير محدد'));
        $customerPhone = $order->owner_phone ?: ($order->customer->phone ?? ($order->address->recipient_phone ?? 'غير محدد'));
        $total = number_format($order->total, 2);

        $deliveryTypes = [
            'local' => '🚚 توصيل محلي',
            'pickup' => '🏪 استلام من الفرع',
            'shipping' => '📦 شحن',
        ];
        $deliveryType = $deliveryTypes[$order->delivery_type] ?? $order->delivery_type;

        $text = "🔔 <b>طلب جديد!</b>\n\n";
        if ($order->payment_method === 'bank_transfer' && ($order->bank_transfer_receipt || $order->payment_justification)) {
            $text = "💳 <b>تم إرفاق إيصال تحويل لطلب!</b>\n\n";
        }
        $text .= "📦 رقم الطلب: <b>{$order->order_number}</b>\n";
        $text .= "👤 العميل: {$customerName}\n";
        $text .= "📱 الجوال: {$customerPhone}\n\n";

        $text .= "<b>🛒 المنتجات:</b>\n";
        foreach ($order->items as $item) {
            $productName = $item->product->name ?? $item->product_name ?? 'منتج';
            $text .= "  • {$productName} × {$item->quantity}\n";
        }

        $text .= "\n💵 الإجمالي: <b>{$total} ر.س</b>\n";
        $text .= "📍 {$deliveryType}\n";

        if ($order->address) {
            $text .= "🏠 {$order->address->city}";
            if ($order->address->street) {
                $text .= " - {$order->address->street}";
            }
            $text .= "\n";
        }

        if ($order->notes) {
            $text .= "\n📝 ملاحظات: {$order->notes}\n";
        }

        $buttons = [
            [
                ['text' => '✅ تأكيد الطلب', 'callback_data' => "admin_confirm_{$order->id}"],
                ['text' => '❌ إلغاء', 'callback_data' => "admin_cancel_{$order->id}"],
            ],
            [
                ['text' => '📋 تفاصيل الطلب', 'callback_data' => "admin_detail_{$order->id}"],
            ],
        ];

        foreach ($admins as $admin) {
            try {
                $this->sendMessage($admin->telegram_chat_id, $text, ['inline_keyboard' => $buttons]);
            } catch (\Exception $e) {
                Log::error("Failed to notify admin {$admin->id} via Telegram", ['error' => $e->getMessage()]);
            }
        }
    }

    public function notifyDriverUpdate(Order $order, string $event)
    {
        $admins = User::where('role', 'admin')
            ->whereNotNull('telegram_chat_id')
            ->where('telegram_notify_driver', true)
            ->get();

        if ($admins->isEmpty()) return;

        $order->load(['driver', 'address']);

        $events = [
            'accepted' => '✅ قبل المندوب الطلب',
            'picked_up' => '📦 استلم المندوب الطلب من المتجر',
            'delivered' => '🎉 تم تسليم الطلب للعميل',
        ];

        $eventText = $events[$event] ?? $event;
        $driverName = $order->driver->name ?? 'غير محدد';

        $text = "🚗 <b>تحديث المندوب</b>\n\n";
        $text .= "{$eventText}\n\n";
        $text .= "📦 رقم الطلب: <b>{$order->order_number}</b>\n";
        $text .= "🧑‍✈️ المندوب: {$driverName}\n";

        if ($order->address) {
            $text .= "📍 {$order->address->city}";
            if ($order->address->street) {
                $text .= " - {$order->address->street}";
            }
            $text .= "\n";
        }

        foreach ($admins as $admin) {
            try {
                $this->sendMessage($admin->telegram_chat_id, $text);
            } catch (\Exception $e) {
                Log::error("Failed to notify admin {$admin->id} about driver update", ['error' => $e->getMessage()]);
            }
        }
    }
}
