<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Driver;
use Illuminate\Http\Request;
use App\Services\TelegramService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    protected $telegram;

    public function __construct(TelegramService $telegram)
    {
        $this->telegram = $telegram;
    }

    public function handle(Request $request)
    {
        $data = $request->all();

        if (isset($data['message'])) {
            $this->handleMessage($data['message']);
        } elseif (isset($data['callback_query'])) {
            $this->handleCallbackQuery($data['callback_query']);
        }

        return response()->json(['status' => 'success']);
    }

    protected function handleMessage($message)
    {
        $chatId = $message['chat']['id'];
        $text = $message['text'] ?? '';
        $username = $message['from']['username'] ?? null;

        if ($text === '/start') {
            if ($username) {
                // Find driver by username without @
                $driver = Driver::where('telegram_username', $username)
                    ->orWhere('telegram_username', '@' . $username)
                    ->first();

                if ($driver) {
                    $driver->update(['telegram_chat_id' => $chatId]);
                    $this->telegram->sendMessage($chatId, "مرحباً بك {$driver->name}! تم ربط حسابك في نظام توصيل لافندر بنجاح. 🌸 ستصلك طلبات التوصيل هنا.");
                } else {
                    $this->telegram->sendMessage($chatId, "مرحباً بك! لم يتم العثور على حساب مندوب مرتبط بهذا المعرف (@{$username}). يرجى الطلب من الإدارة إضافتك.");
                }
            } else {
                $this->telegram->sendMessage($chatId, "مرحباً بك! لربط حسابك، يرجى تعيين (معرف مستخدم - Username) في إعدادات تيليجرام الخاص بك، ثم أرسل /start مجدداً.");
            }
        }
    }

    protected function handleCallbackQuery($callbackQuery)
    {
        $data = $callbackQuery['data'];
        $chatId = $callbackQuery['message']['chat']['id'];
        $messageId = $callbackQuery['message']['message_id'];
        $callbackQueryId = $callbackQuery['id'];

        // Find driver by chat id
        $driver = Driver::where('telegram_chat_id', $chatId)->first();

        if (!$driver) {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'حساب المندوب غير مسجل في النظام!', true);
            return;
        }

        if (str_starts_with($data, 'accept_order_')) {
            $orderId = str_replace('accept_order_', '', $data);
            $this->acceptOrder($orderId, $driver, $chatId, $messageId, $callbackQueryId);
        } elseif (str_starts_with($data, 'delivered_order_')) {
            $orderId = str_replace('delivered_order_', '', $data);
            $this->markAsDelivered($orderId, $driver, $chatId, $messageId, $callbackQueryId);
        } else {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'أمر غير معروف.');
        }
    }

    protected function acceptOrder($orderId, $driver, $chatId, $messageId, $callbackQueryId)
    {
        $order = Order::find($orderId);

        if (!$order) {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'الطلب غير موجود!', true);
            return;
        }

        if ($order->driver_id) {
            if ($order->driver_id == $driver->id) {
                $this->telegram->answerCallbackQuery($callbackQueryId, 'لقد قمت باستلام هذا الطلب مسبقاً.');
            } else {
                $this->telegram->answerCallbackQuery($callbackQueryId, 'نعتذر، تم استلام الطلب من مندوب آخر.', true);
                
                // Update the message for this driver to show it's taken
                $this->telegram->editMessageText($chatId, $messageId, "عذراً، هذا الطلب لم يعد متاحاً وتم استلامه من مندوب آخر. 🌸");
            }
            return;
        }

        // Accept the order
        $order->update([
            'driver_id' => $driver->id,
            'status' => 'delivering',
            'delivering_at' => now(),
        ]);

        $this->telegram->answerCallbackQuery($callbackQueryId, 'تم تسجيل الطلب باسمك بنجاح! توجه للعميل.');

        // Update the message to show "Delivered" button
        $address = $order->address;
        $mapsUrl = "https://maps.google.com/?q={$address->street}"; // Fallback if no lat/lng
        
        $newText = "✅ <b>تم استلام الطلب!</b>\n\n";
        $newText .= "رقم الطلب: <b>{$order->order_number}</b>\n";
        $newText .= "العميل: {$address->recipient_name} ({$address->recipient_phone})\n";
        $newText .= "العنوان: {$address->city}, {$address->street}\n\n";
        $newText .= "الرجاء الضغط على الزر أدناه عند وصولك وتسليم الطلب للعميل.";

        $replyMarkup = [
            'inline_keyboard' => [
                [
                    ['text' => '📍 موقع العميل (خرائط جوجل)', 'url' => $mapsUrl]
                ],
                [
                    ['text' => '📦 تم تسليم الطلب للعميل', 'callback_data' => "delivered_order_{$order->id}"]
                ]
            ]
        ];

        $this->telegram->editMessageText($chatId, $messageId, $newText, $replyMarkup);
    }

    protected function markAsDelivered($orderId, $driver, $chatId, $messageId, $callbackQueryId)
    {
        $order = Order::find($orderId);

        if (!$order) {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'الطلب غير موجود!', true);
            return;
        }

        if ($order->driver_id != $driver->id) {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'هذا الطلب ليس مسنداً إليك!', true);
            return;
        }

        if ($order->status == 'delivered') {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'الطلب مكتمل مسبقاً.');
            return;
        }

        // Complete the order
        $order->update([
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);

        $this->telegram->answerCallbackQuery($callbackQueryId, 'تم تسليم الطلب بنجاح! عمل رائع 🌟', true);

        // Update the message
        $newText = "🎉 <b>اكتمل الطلب!</b>\n\n";
        $newText .= "رقم الطلب: {$order->order_number}\n";
        $newText .= "شكراً لك {$driver->name} على مجهودك. 🌸";

        $this->telegram->editMessageText($chatId, $messageId, $newText, null); // Remove keyboard
    }
}
