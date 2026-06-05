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

        $webhookController = app(\App\Http\Controllers\TelegramWebhookController::class);

        foreach ($updates as $update) {
            try {
                if (isset($update['message'])) {
                    // Make handleMessage public or call it via reflection/internal method
                    // For simplicity, we can simulate a Request to the handle method
                    $request = request()->merge($update);
                    $webhookController->handle($request);
                    $synced++;
                } elseif (isset($update['callback_query'])) {
                    $request = request()->merge($update);
                    $webhookController->handle($request);
                    $synced++;
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('TelegramPoll Error processing update', ['error' => $e->getMessage()]);
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
