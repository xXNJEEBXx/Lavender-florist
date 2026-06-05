<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\Driver;
use App\Services\TelegramService;

class TelegramPoll extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:poll';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Poll Telegram API for updates and sync driver chat IDs';

    /**
     * Execute the console command.
     */
    public function handle(TelegramService $telegram)
    {
        $this->info('Polling Telegram for updates...');
        $token = config('app.telegram_bot_token', env('TELEGRAM_BOT_TOKEN'));
        
        $response = Http::get("https://api.telegram.org/bot{$token}/getUpdates");
        
        if (!$response->successful()) {
            $this->error('Failed to connect to Telegram API.');
            return;
        }

        $updates = $response->json()['result'] ?? [];
        $synced = 0;

        foreach ($updates as $update) {
            if (isset($update['message']['text']) && $update['message']['text'] === '/start') {
                $username = $update['message']['from']['username'] ?? null;
                $chatId = $update['message']['chat']['id'];

                if ($username) {
                    $driver = Driver::where('telegram_username', $username)
                        ->orWhere('telegram_username', '@' . $username)
                        ->first();

                    if ($driver && $driver->telegram_chat_id != $chatId) {
                        $driver->update(['telegram_chat_id' => $chatId]);
                        $telegram->sendMessage($chatId, "مرحباً بك {$driver->name}! تم ربط حسابك في نظام توصيل لافندر بنجاح. 🌸 ستصلك طلبات التوصيل هنا.");
                        $this->info("Synced driver: {$driver->name} (@{$username})");
                        $synced++;
                    }
                }
            }
        }

        // Acknowledge updates by passing offset = last update_id + 1
        if (!empty($updates)) {
            $lastUpdateId = end($updates)['update_id'];
            Http::get("https://api.telegram.org/bot{$token}/getUpdates", ['offset' => $lastUpdateId + 1]);
        }

        $this->info("Polling complete. Synced {$synced} drivers.");
    }
}
