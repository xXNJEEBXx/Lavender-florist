<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Driver;
use App\Models\User;
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
            $this->handleStart($chatId, $username);
        } elseif ($text === '/orders') {
            $this->handleOrdersCommand($chatId);
        } elseif ($text === '/status') {
            $this->handleStatusCommand($chatId);
        } elseif ($text === '/help') {
            $this->handleHelpCommand($chatId);
        }
    }

    protected function handleStart($chatId, $username)
    {
        if (!$username) {
            $this->telegram->sendMessage($chatId, "مرحباً بك! لربط حسابك، يرجى تعيين (معرف مستخدم - Username) في إعدادات تيليجرام الخاص بك، ثم أرسل /start مجدداً.");
            return;
        }

        // 1. Check if it's a driver
        $driver = Driver::where('telegram_username', $username)
            ->orWhere('telegram_username', '@' . $username)
            ->first();

        if ($driver) {
            $driver->update(['telegram_chat_id' => $chatId]);
            $this->telegram->sendMessage($chatId, "مرحباً بك {$driver->name}! تم ربط حسابك في نظام توصيل لافندر بنجاح. 🌸 ستصلك طلبات التوصيل هنا.");
            
            // Also check if this username belongs to an admin
            $admin = User::where('role', 'admin')
                ->where(function ($q) use ($username) {
                    $q->where('telegram_username', $username)
                      ->orWhere('telegram_username', '@' . $username);
                })->first();
            
            if ($admin) {
                $admin->update(['telegram_chat_id' => $chatId]);
                $this->telegram->sendMessage($chatId, "✅ تم ربط حساب المشرف أيضاً! ستصلك إشعارات الطلبات الجديدة والتحديثات.\n\nالأوامر المتاحة:\n/orders — عرض الطلبات النشطة\n/status — إحصائيات سريعة\n/help — المساعدة");
            }
            return;
        }

        // 2. Check if it's an admin
        $admin = User::where('role', 'admin')
            ->where(function ($q) use ($username) {
                $q->where('telegram_username', $username)
                  ->orWhere('telegram_username', '@' . $username);
            })->first();

        if ($admin) {
            $admin->update(['telegram_chat_id' => $chatId]);
            $this->telegram->sendMessage($chatId, "مرحباً بك {$admin->name}! 🌸\nتم ربط حسابك كمشرف في نظام لافندر فلوريست بنجاح.\n\nستصلك إشعارات الطلبات الجديدة هنا.\n\nالأوامر المتاحة:\n/orders — عرض الطلبات النشطة\n/status — إحصائيات سريعة\n/help — المساعدة");
            return;
        }

        // 3. No match found
        $this->telegram->sendMessage($chatId, "مرحباً بك! لم يتم العثور على حساب مندوب أو مشرف مرتبط بهذا المعرف (@{$username}).\n\nيرجى الطلب من الإدارة إضافة معرفك في الإعدادات.");
    }

    // ==========================================
    // Admin Commands
    // ==========================================

    protected function handleOrdersCommand($chatId)
    {
        $admin = User::where('telegram_chat_id', $chatId)->where('role', 'admin')->first();
        if (!$admin) {
            // Maybe it's a driver, ignore
            return;
        }

        $orders = Order::with(['customer', 'address', 'items'])
            ->whereNotIn('status', ['delivered', 'cancelled'])
            ->latest()
            ->take(10)
            ->get();

        if ($orders->isEmpty()) {
            $this->telegram->sendMessage($chatId, "✅ لا توجد طلبات نشطة حالياً.");
            return;
        }

        $statusLabels = [
            'pending' => '🟡 بانتظار الدفع',
            'confirmed' => '🔵 مؤكد',
            'preparing' => '🟠 قيد التجهيز',
            'ready' => '🟢 جاهز',
            'delivering' => '🚗 جاري التوصيل',
        ];

        foreach ($orders as $order) {
            $status = $statusLabels[$order->status] ?? $order->status;
            $customerName = $order->owner_name ?? $order->customer->name ?? 'غير محدد';
            $total = number_format($order->total, 2);
            $itemsCount = $order->items->sum('quantity');

            $text = "{$status}\n\n";
            $text .= "📦 <b>{$order->order_number}</b>\n";
            $text .= "👤 {$customerName}\n";
            $text .= "🛒 {$itemsCount} منتج | 💰 {$total} ر.س\n";
            
            if ($order->address) {
                $text .= "📍 {$order->address->city}";
                if ($order->address->street) {
                    $text .= " - {$order->address->street}";
                }
                $text .= "\n";
            }

            $buttons = $this->getAdminButtons($order);

            $this->telegram->sendMessage($chatId, $text, ['inline_keyboard' => $buttons]);
        }
    }

    protected function handleStatusCommand($chatId)
    {
        $admin = User::where('telegram_chat_id', $chatId)->where('role', 'admin')->first();
        if (!$admin) return;

        $pending = Order::where('status', 'pending')->count();
        $confirmed = Order::where('status', 'confirmed')->count();
        $preparing = Order::where('status', 'preparing')->count();
        $ready = Order::where('status', 'ready')->count();
        $delivering = Order::where('status', 'delivering')->count();
        $todayDelivered = Order::where('status', 'delivered')
            ->whereDate('delivered_at', today())
            ->count();
        $todayRevenue = Order::where('status', 'delivered')
            ->whereDate('delivered_at', today())
            ->sum('total');

        $text = "📊 <b>إحصائيات اليوم</b>\n\n";
        $text .= "🟡 بانتظار الدفع: <b>{$pending}</b>\n";
        $text .= "🔵 مؤكد: <b>{$confirmed}</b>\n";
        $text .= "🟠 قيد التجهيز: <b>{$preparing}</b>\n";
        $text .= "🟢 جاهز: <b>{$ready}</b>\n";
        $text .= "🚗 جاري التوصيل: <b>{$delivering}</b>\n\n";
        $text .= "✅ مكتمل اليوم: <b>{$todayDelivered}</b>\n";
        $text .= "💰 إيرادات اليوم: <b>" . number_format($todayRevenue, 2) . " ر.س</b>";

        $this->telegram->sendMessage($chatId, $text);
    }

    protected function handleHelpCommand($chatId)
    {
        $text = "🌸 <b>أوامر بوت لافندر فلوريست</b>\n\n";
        $text .= "/orders — عرض الطلبات النشطة مع أزرار التحكم\n";
        $text .= "/status — إحصائيات وأرقام اليوم\n";
        $text .= "/help — عرض هذه الرسالة\n\n";
        $text .= "يمكنك أيضاً إدارة الطلبات مباشرة من الأزرار التي تظهر مع كل إشعار طلب جديد. 🚀";

        $this->telegram->sendMessage($chatId, $text);
    }

    // ==========================================
    // Callback Query Handler
    // ==========================================

    protected function handleCallbackQuery($callbackQuery)
    {
        $data = $callbackQuery['data'];
        $chatId = $callbackQuery['message']['chat']['id'];
        $messageId = $callbackQuery['message']['message_id'];
        $callbackQueryId = $callbackQuery['id'];

        // Admin callbacks
        if (str_starts_with($data, 'admin_')) {
            $admin = User::where('telegram_chat_id', $chatId)->where('role', 'admin')->first();
            if (!$admin) {
                $this->telegram->answerCallbackQuery($callbackQueryId, 'ليس لديك صلاحية!', true);
                return;
            }

            if (str_starts_with($data, 'admin_confirm_')) {
                $orderId = str_replace('admin_confirm_', '', $data);
                $this->adminUpdateStatus($orderId, 'confirmed', $chatId, $messageId, $callbackQueryId);
            } elseif (str_starts_with($data, 'admin_preparing_')) {
                $orderId = str_replace('admin_preparing_', '', $data);
                $this->adminUpdateStatus($orderId, 'preparing', $chatId, $messageId, $callbackQueryId);
            } elseif (str_starts_with($data, 'admin_ready_')) {
                $orderId = str_replace('admin_ready_', '', $data);
                $this->adminUpdateStatus($orderId, 'ready', $chatId, $messageId, $callbackQueryId);
            } elseif (str_starts_with($data, 'admin_cancel_')) {
                $orderId = str_replace('admin_cancel_', '', $data);
                $this->adminUpdateStatus($orderId, 'cancelled', $chatId, $messageId, $callbackQueryId);
            } elseif (str_starts_with($data, 'admin_detail_')) {
                $orderId = str_replace('admin_detail_', '', $data);
                $this->adminShowDetail($orderId, $chatId, $messageId, $callbackQueryId);
            }
            return;
        }

        // Driver callbacks (existing logic)
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

    // ==========================================
    // Admin Callback Actions
    // ==========================================

    protected function adminUpdateStatus($orderId, $newStatus, $chatId, $messageId, $callbackQueryId)
    {
        $order = Order::with(['items.product', 'address', 'customer'])->find($orderId);
        if (!$order) {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'الطلب غير موجود!', true);
            return;
        }

        $statusLabels = [
            'confirmed' => 'مؤكد',
            'preparing' => 'قيد التجهيز',
            'ready' => 'جاهز',
            'cancelled' => 'ملغي',
        ];

        $order->update(['status' => $newStatus]);

        $statusLabel = $statusLabels[$newStatus] ?? $newStatus;
        $this->telegram->answerCallbackQuery($callbackQueryId, "تم تحديث حالة الطلب إلى: {$statusLabel}");

        // Update the message
        $text = $this->buildAdminOrderMessage($order->fresh(['items.product', 'address', 'customer']));
        $buttons = $this->getAdminButtons($order->fresh());

        $this->telegram->editMessageText($chatId, $messageId, $text, ['inline_keyboard' => $buttons]);
    }

    protected function adminShowDetail($orderId, $chatId, $messageId, $callbackQueryId)
    {
        $order = Order::with(['items.product', 'address', 'customer'])->find($orderId);
        if (!$order) {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'الطلب غير موجود!', true);
            return;
        }

        $this->telegram->answerCallbackQuery($callbackQueryId);

        $statusLabels = [
            'pending' => '🟡 بانتظار الدفع',
            'confirmed' => '🔵 مؤكد',
            'preparing' => '🟠 قيد التجهيز',
            'ready' => '🟢 جاهز',
            'delivering' => '🚗 جاري التوصيل',
            'delivered' => '✅ مكتمل',
            'cancelled' => '❌ ملغي',
        ];

        $status = $statusLabels[$order->status] ?? $order->status;
        $customerName = $order->owner_name ?? $order->customer->name ?? 'غير محدد';
        $customerPhone = $order->customer->phone ?? 'غير محدد';

        $text = "📋 <b>تفاصيل الطلب</b>\n\n";
        $text .= "📦 رقم الطلب: <b>{$order->order_number}</b>\n";
        $text .= "الحالة: {$status}\n";
        $text .= "👤 صاحب الطلب: {$customerName}\n";
        $text .= "📱 الجوال: {$customerPhone}\n\n";

        // Items
        $text .= "<b>🛒 المنتجات:</b>\n";
        foreach ($order->items as $item) {
            $productName = $item->product->name ?? $item->product_name ?? 'منتج';
            $text .= "  • {$productName} × {$item->quantity} = " . number_format($item->quantity * $item->unit_price, 2) . " ر.س\n";
        }

        $text .= "\n💰 المجموع: <b>" . number_format($order->subtotal, 2) . " ر.س</b>\n";
        if ($order->delivery_fee > 0) {
            $text .= "🚚 التوصيل: " . number_format($order->delivery_fee, 2) . " ر.س\n";
        }
        if ($order->discount > 0) {
            $text .= "🏷️ خصم: -" . number_format($order->discount, 2) . " ر.س\n";
        }
        $text .= "💵 الإجمالي: <b>" . number_format($order->total, 2) . " ر.س</b>\n";

        // Address
        if ($order->address) {
            $text .= "\n📍 <b>العنوان:</b>\n";
            $text .= "  المدينة: {$order->address->city}\n";
            if ($order->address->street) {
                $text .= "  الشارع: {$order->address->street}\n";
            }
            if ($order->address->recipient_name) {
                $text .= "  المستلم: {$order->address->recipient_name}\n";
            }
            if ($order->address->recipient_phone) {
                $text .= "  جوال المستلم: {$order->address->recipient_phone}\n";
            }
        }

        if ($order->notes) {
            $text .= "\n📝 ملاحظات: {$order->notes}\n";
        }

        $text .= "\n🕐 تاريخ الطلب: " . $order->created_at->format('Y-m-d H:i');

        $buttons = $this->getAdminButtons($order);
        $this->telegram->sendMessage($chatId, $text, ['inline_keyboard' => $buttons]);
    }

    protected function getAdminButtons($order)
    {
        $buttons = [];
        
        switch ($order->status) {
            case 'pending':
                $buttons[] = [
                    ['text' => '✅ تأكيد الطلب', 'callback_data' => "admin_confirm_{$order->id}"],
                    ['text' => '❌ إلغاء', 'callback_data' => "admin_cancel_{$order->id}"],
                ];
                break;
            case 'confirmed':
                $buttons[] = [
                    ['text' => '🔧 بدء التجهيز', 'callback_data' => "admin_preparing_{$order->id}"],
                    ['text' => '❌ إلغاء', 'callback_data' => "admin_cancel_{$order->id}"],
                ];
                break;
            case 'preparing':
                $buttons[] = [
                    ['text' => '✅ جاهز للتوصيل', 'callback_data' => "admin_ready_{$order->id}"],
                ];
                break;
            case 'ready':
                // Order is ready, no more admin actions needed (driver takes over)
                break;
        }

        // Always show detail button for active orders
        if (!in_array($order->status, ['delivered', 'cancelled'])) {
            $buttons[] = [
                ['text' => '📋 تفاصيل الطلب', 'callback_data' => "admin_detail_{$order->id}"],
            ];
        }

        return $buttons;
    }

    protected function buildAdminOrderMessage($order)
    {
        $statusLabels = [
            'pending' => '🟡 بانتظار الدفع',
            'confirmed' => '🔵 مؤكد',
            'preparing' => '🟠 قيد التجهيز',
            'ready' => '🟢 جاهز',
            'delivering' => '🚗 جاري التوصيل',
            'delivered' => '✅ مكتمل',
            'cancelled' => '❌ ملغي',
        ];

        $status = $statusLabels[$order->status] ?? $order->status;
        $customerName = $order->owner_name ?: ($order->customer->name ?? ($order->address->recipient_name ?? 'غير محدد'));
        $customerPhone = $order->owner_phone ?: ($order->customer->phone ?? ($order->address->recipient_phone ?? 'غير محدد'));
        $total = number_format($order->total, 2);
        $itemsCount = $order->items->sum('quantity');

        $text = "{$status}\n\n";
        $text .= "📦 <b>{$order->order_number}</b>\n";
        $text .= "👤 {$customerName}\n";
        $text .= "📱 {$customerPhone}\n";
        $text .= "🛒 {$itemsCount} منتج | 💰 {$total} ر.س\n";

        if ($order->address) {
            $text .= "📍 {$order->address->city}";
            if ($order->address->street) {
                $text .= " - {$order->address->street}";
            }
            $text .= "\n";
        }

        return $text;
    }

    // ==========================================
    // Static method: Notify admins about new order
    // ==========================================

    public static function notifyAdminsNewOrder(Order $order)
    {
        $telegram = app(TelegramService::class);

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

        // Items summary
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
                $telegram->sendMessage($admin->telegram_chat_id, $text, ['inline_keyboard' => $buttons]);
            } catch (\Exception $e) {
                Log::error("Failed to notify admin {$admin->id} via Telegram", ['error' => $e->getMessage()]);
            }
        }
    }

    // ==========================================
    // Static method: Notify admins about driver updates
    // ==========================================

    public static function notifyAdminsDriverUpdate(Order $order, string $event)
    {
        $telegram = app(TelegramService::class);

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
                $telegram->sendMessage($admin->telegram_chat_id, $text);
            } catch (\Exception $e) {
                Log::error("Failed to notify admin {$admin->id} about driver update", ['error' => $e->getMessage()]);
            }
        }
    }

    // ==========================================
    // Driver Actions (Existing, Preserved)
    // ==========================================

    protected function acceptOrder($orderId, $driver, $chatId, $messageId, $callbackQueryId)
    {
        $order = Order::find($orderId);
        Log::info("Telegram acceptOrder started", ['order_id' => $orderId, 'driver_id' => $driver->id]);

        if (!$order) {
            $this->telegram->answerCallbackQuery($callbackQueryId, 'الطلب غير موجود!', true);
            return;
        }

        if ($order->driver_id) {
            Log::info("Order already assigned", ['driver_id' => $order->driver_id]);
            if ($order->driver_id == $driver->id) {
                $this->telegram->answerCallbackQuery($callbackQueryId, 'لقد قمت بقبول هذا الطلب مسبقاً.');
                
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
                $this->telegram->editMessageText($chatId, $messageId, $newText, $replyMarkup);

            } else {
                $this->telegram->answerCallbackQuery($callbackQueryId, 'نعتذر، تم استلام الطلب من مندوب آخر.', true);
                $this->telegram->editMessageText($chatId, $messageId, "عذراً، هذا الطلب لم يعد متاحاً وتم استلامه من مندوب آخر. 🌸");
            }
            return;
        }

        $order->update([
            'driver_id' => $driver->id,
        ]);
        Log::info("Order DB updated successfully (driver assigned)");

        $this->telegram->answerCallbackQuery($callbackQueryId, 'تم تسجيل الطلب باسمك بنجاح! توجه للمتجر.');

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

        $this->telegram->editMessageText($chatId, $messageId, $newText, $replyMarkup);

        // Notify admins
        self::notifyAdminsDriverUpdate($order, 'accepted');
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
            
            $address = $order->address;
            $mapsUrl = $address->latitude && $address->longitude 
                ? "https://maps.google.com/?q={$address->latitude},{$address->longitude}"
                : "https://maps.google.com/?q=" . urlencode($address->street);
            
            $newText = "🚗 <b>جاري التوصيل للعميل!</b>\n\n";
            $newText .= "رقم الطلب: <b>{$order->order_number}</b>\n";
            $recipientName = $address->recipient_name ?: 'غير محدد';
            $newText .= "العميل: {$recipientName} ({$address->recipient_phone})\n";
            $newText .= "العنوان: {$address->city}, {$address->street}\n";
            
            if ($address && $address->delivery_notes) {
                $newText .= "\n📝 <b>ملاحظات إضافية للتوصيل:</b>\n" . e($address->delivery_notes) . "\n";
            }
            
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

        $order->update([
            'status' => 'delivering',
            'delivering_at' => now(),
        ]);

        $this->telegram->answerCallbackQuery($callbackQueryId, 'تم تأكيد استلام الطلب من المتجر! توجه للعميل.');

        $address = $order->address;
        $mapsUrl = $address->latitude && $address->longitude 
            ? "https://maps.google.com/?q={$address->latitude},{$address->longitude}"
            : "https://maps.google.com/?q=" . urlencode($address->street);
        
        $newText = "🚗 <b>جاري التوصيل للعميل!</b>\n\n";
        $newText .= "رقم الطلب: <b>{$order->order_number}</b>\n";
        $recipientName = $address->recipient_name ?: 'غير محدد';
        $newText .= "العميل: {$recipientName} ({$address->recipient_phone})\n";
        $newText .= "العنوان: {$address->city}, {$address->street}\n";
        
        if ($address && $address->delivery_notes) {
            $newText .= "\n📝 <b>ملاحظات إضافية للتوصيل:</b>\n" . e($address->delivery_notes) . "\n";
        }
        
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

        // Notify admins
        self::notifyAdminsDriverUpdate($order, 'picked_up');
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
        $recipientName = $address->recipient_name ?: 'غير محدد';
        $newText .= "العميل: {$recipientName} ({$address->recipient_phone})\n";
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
        $recipientName = $address->recipient_name ?: 'غير محدد';
        $newText .= "العميل: {$recipientName} ({$address->recipient_phone})\n";
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

        $order->update([
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);

        // Add delivery fee to driver's balance
        $driver->increment('balance', $order->delivery_fee);

        $this->telegram->answerCallbackQuery($callbackQueryId, 'تم تسليم الطلب بنجاح! عمل رائع 🌟');

        $totalEarnings = $driver->balance; // Use the updated balance instead of querying sum again

        $address = $order->address;
        
        $newText = "🎉 <b>اكتمل الطلب بنجاح!</b>\n\n";
        $newText .= "رقم الطلب: <b>{$order->order_number}</b>\n";
        if ($address) {
            $recipientName = $address->recipient_name ?: 'غير محدد';
            $newText .= "العميل: {$recipientName} ({$address->recipient_phone})\n\n";
        }
        $newText .= "شكراً لك {$driver->name} على مجهودك. 🌸\n\n";
        $newText .= "💰 <b>إجمالي مبالغك المستحقة:</b> {$totalEarnings} ر.س";

        $this->telegram->editMessageText($chatId, $messageId, $newText, ['inline_keyboard' => []]);

        // Notify admins
        self::notifyAdminsDriverUpdate($order, 'delivered');
    }
}
