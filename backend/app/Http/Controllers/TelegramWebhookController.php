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
        } elseif (str_starts_with($data, 'picked_up_order_')) {
            $orderId = str_replace('picked_up_order_', '', $data);
            $this->pickedUpOrder($orderId, $driver, $chatId, $messageId, $callbackQueryId);
        } elseif (str_starts_with($data, 'ask_deliver_order_')) {
            $orderId = str_replace('ask_deliver_order_', '', $data);
            $this->askDeliverOrder($orderId, $driver, $chatId, $messageId, $callbackQueryId);
        } elseif (str_starts_with($data, 'cancel_deliver_order_')) {
            $orderId = str_replace('cancel_deliver_order_', '', $data);
            $this->cancelDeliverOrder($orderId, $driver, $chatId, $messageId, $callbackQueryId);
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
        \Illuminate\Support\Facades\Log::info("Telegram acceptOrder started", ['order_id' => $orderId, 'driver_id' => $driver->id]);

        if (!$order) {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'الطلب غير موجود!', true);
            return;
        }

        if ($order->driver_id) {
            \Illuminate\Support\Facades\Log::info("Order already assigned", ['driver_id' => $order->driver_id]);
            if ($order->driver_id == $driver->id) {
                $this->telegram->answerCallbackQuery($callbackQueryId, 'لقد قمت بقبول هذا الطلب مسبقاً.');
                
                // Force update the message
                $newText = "✅ <b>تم قبول الطلب!</b>\n\n";
                $newText .= "رقم الطلب: <b>{$order->order_number}</b>\n\n";
                $newText .= "يرجى التوجه للمتجر لاستلام الطلب.\n";
                $newText .= "الرجاء الضغط على الزر أدناه عند استلامك للطلب من المتجر.";

                $replyMarkup = [
                    'inline_keyboard' => [
                        [
                            ['text' => '📍 موقع المتجر', 'url' => 'https://maps.app.goo.gl/M87h2oPSSwYsdJng9']
                        ],
                        [
                            ['text' => '📦 تم استلام الطلب من المتجر', 'callback_data' => "picked_up_order_{$order->id}"]
                        ]
                    ]
                ];
                $res = $this->telegram->editMessageText($chatId, $messageId, $newText, $replyMarkup);
                \Illuminate\Support\Facades\Log::info("Force editMessageText response", ['response' => $res]);

            } else {
                $this->telegram->answerCallbackQuery($callbackQueryId, 'نعتذر، تم استلام الطلب من مندوب آخر.', true);
                $this->telegram->editMessageText($chatId, $messageId, "عذراً، هذا الطلب لم يعد متاحاً وتم استلامه من مندوب آخر. 🌸");
            }
            return;
        }

        // Accept the order
        $order->update([
            'driver_id' => $driver->id,
            // Keep status as ready or preparing, driver is just assigned
        ]);
        \Illuminate\Support\Facades\Log::info("Order DB updated successfully (driver assigned)");

        $this->telegram->answerCallbackQuery($callbackQueryId, 'تم تسجيل الطلب باسمك بنجاح! توجه للمتجر.');

        // Update the message to show "Picked up from store" button
        $newText = "✅ <b>تم قبول الطلب!</b>\n\n";
        $newText .= "رقم الطلب: <b>{$order->order_number}</b>\n\n";
        $newText .= "يرجى التوجه للمتجر لاستلام الطلب.\n";
        $newText .= "الرجاء الضغط على الزر أدناه عند استلامك للطلب من المتجر.";

        $replyMarkup = [
            'inline_keyboard' => [
                [
                    ['text' => '📍 موقع المتجر', 'url' => 'https://maps.app.goo.gl/M87h2oPSSwYsdJng9']
                ],
                [
                    ['text' => '📦 تم استلام الطلب من المتجر', 'callback_data' => "picked_up_order_{$order->id}"]
                ]
            ]
        ];

        $res = $this->telegram->editMessageText($chatId, $messageId, $newText, $replyMarkup);
        \Illuminate\Support\Facades\Log::info("Normal editMessageText response (accept)", ['response' => $res]);
    }

    protected function pickedUpOrder($orderId, $driver, $chatId, $messageId, $callbackQueryId)
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

        if ($order->status == 'delivering' || $order->status == 'delivered') {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'لقد قمت بتأكيد الاستلام مسبقاً.');
            
            // Force update message
            $address = $order->address;
            $mapsUrl = $address->latitude && $address->longitude 
                ? "https://maps.google.com/?q={$address->latitude},{$address->longitude}"
                : "https://maps.google.com/?q=" . urlencode($address->street);
            
            $newText = "🚗 <b>جاري التوصيل للعميل!</b>\n\n";
            $newText .= "رقم الطلب: <b>{$order->order_number}</b>\n";
            $newText .= "العميل: {$address->recipient_name} ({$address->recipient_phone})\n";
            $newText .= "العنوان: {$address->city}, {$address->street}\n";
            
            $newText .= "\nالرجاء الضغط على الزر أدناه عند وصولك وتسليم الطلب للعميل.";

            $replyMarkup = [
                'inline_keyboard' => [
                    [
                        ['text' => '📍 موقع العميل (خرائط جوجل)', 'url' => $mapsUrl]
                    ],
                    [
                        ['text' => '✅ تم تسليم الطلب للعميل', 'callback_data' => "ask_deliver_order_{$order->id}"]
                    ]
                ]
            ];
            $this->telegram->editMessageText($chatId, $messageId, $newText, $replyMarkup);
            
            if ($address->door_image_path) {
                $doorImagePath = public_path($address->door_image_path);
                $this->telegram->sendPhoto($chatId, $doorImagePath, "🚪 صورة باب العميل للطلب: {$order->order_number}");
            }
            return;
        }

        // Pick up the order
        $order->update([
            'status' => 'delivering',
            'delivering_at' => now(),
        ]);

        $this->telegram->answerCallbackQuery($callbackQueryId, 'تم تأكيد استلام الطلب من المتجر! توجه للعميل.');

        // Update the message to show Customer info and "Delivered" button
        $address = $order->address;
        $mapsUrl = $address->latitude && $address->longitude 
            ? "https://maps.google.com/?q={$address->latitude},{$address->longitude}"
            : "https://maps.google.com/?q=" . urlencode($address->street);
        
        $newText = "🚗 <b>جاري التوصيل للعميل!</b>\n\n";
        $newText .= "رقم الطلب: <b>{$order->order_number}</b>\n";
        $newText .= "العميل: {$address->recipient_name} ({$address->recipient_phone})\n";
        $newText .= "العنوان: {$address->city}, {$address->street}\n";
        
        $newText .= "\nالرجاء الضغط على الزر أدناه عند وصولك وتسليم الطلب للعميل.";

        $replyMarkup = [
            'inline_keyboard' => [
                [
                    ['text' => '📍 موقع العميل (خرائط جوجل)', 'url' => $mapsUrl]
                ],
                [
                    ['text' => '✅ تم تسليم الطلب للعميل', 'callback_data' => "ask_deliver_order_{$order->id}"]
                ]
            ]
        ];

        $this->telegram->editMessageText($chatId, $messageId, $newText, $replyMarkup);
        
        if ($address->door_image_path) {
            $doorImagePath = public_path($address->door_image_path);
            $this->telegram->sendPhoto($chatId, $doorImagePath, "🚪 صورة باب العميل للطلب: {$order->order_number}");
        }
    }

    protected function askDeliverOrder($orderId, $driver, $chatId, $messageId, $callbackQueryId)
    {
        $order = Order::with('address')->find($orderId);
        
        if (!$order) {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'الطلب غير موجود!', true);
            return;
        }

        $address = $order->address;
        $mapsUrl = $address->latitude && $address->longitude 
            ? "https://maps.google.com/?q={$address->latitude},{$address->longitude}"
            : "https://maps.google.com/?q=" . urlencode($address->street);

        $newText = "🚗 <b>جاري التوصيل للعميل!</b>\n\n";
        $newText .= "رقم الطلب: <b>{$order->order_number}</b>\n";
        $newText .= "العميل: {$address->recipient_name} ({$address->recipient_phone})\n";
        $newText .= "العنوان: {$address->city}, {$address->street}\n";
        $newText .= "\n⚠️ <b>هل أنت متأكد أنك قمت بتسليم الطلب للعميل؟</b>";

        $replyMarkup = [
            'inline_keyboard' => [
                [
                    ['text' => '📍 موقع العميل (خرائط جوجل)', 'url' => $mapsUrl]
                ],
                [
                    ['text' => '✅ نعم، متأكد من التسليم', 'callback_data' => "delivered_order_{$order->id}"],
                    ['text' => '❌ تراجع', 'callback_data' => "cancel_deliver_order_{$order->id}"]
                ]
            ]
        ];

        $this->telegram->editMessageText($chatId, $messageId, $newText, $replyMarkup);
    }

    protected function cancelDeliverOrder($orderId, $driver, $chatId, $messageId, $callbackQueryId)
    {
        $order = Order::with('address')->find($orderId);
        
        if (!$order) {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'الطلب غير موجود!', true);
            return;
        }

        $address = $order->address;
        $mapsUrl = $address->latitude && $address->longitude 
            ? "https://maps.google.com/?q={$address->latitude},{$address->longitude}"
            : "https://maps.google.com/?q=" . urlencode($address->street);

        $newText = "🚗 <b>جاري التوصيل للعميل!</b>\n\n";
        $newText .= "رقم الطلب: <b>{$order->order_number}</b>\n";
        $newText .= "العميل: {$address->recipient_name} ({$address->recipient_phone})\n";
        $newText .= "العنوان: {$address->city}, {$address->street}\n";
        $newText .= "\nالرجاء الضغط على الزر أدناه عند وصولك وتسليم الطلب للعميل.";

        $replyMarkup = [
            'inline_keyboard' => [
                [
                    ['text' => '📍 موقع العميل (خرائط جوجل)', 'url' => $mapsUrl]
                ],
                [
                    ['text' => '✅ تم تسليم الطلب للعميل', 'callback_data' => "ask_deliver_order_{$order->id}"]
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

        // Mark as delivered
        $order->update([
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);

        $this->telegram->answerCallbackQuery($callbackQueryId, 'تم تسليم الطلب بنجاح! عمل رائع 🌟');

        // Calculate driver earnings
        $totalEarnings = Order::where('driver_id', $driver->id)
            ->where('status', 'delivered')
            ->sum('delivery_fee');

        $address = $order->address;
        
        // Update the message
        $newText = "🎉 <b>اكتمل الطلب بنجاح!</b>\n\n";
        $newText .= "رقم الطلب: <b>{$order->order_number}</b>\n";
        if ($address) {
            $newText .= "العميل: {$address->recipient_name} ({$address->recipient_phone})\n\n";
        }
        $newText .= "شكراً لك {$driver->name} على مجهودك. 🌸\n\n";
        $newText .= "💰 <b>إجمالي مبالغك المستحقة:</b> {$totalEarnings} ر.س";

        $this->telegram->editMessageText($chatId, $messageId, $newText, ['inline_keyboard' => []]); // Remove keyboard
    }
}
