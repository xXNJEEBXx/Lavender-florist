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
    protected $signature = 'telegram:poll {--daemon : Run continuously}';

    protected $description = 'Poll Telegram API for updates and sync driver chat IDs';

    public function handle(TelegramService $telegram)
    {
        $this->info('Starting Telegram polling...');
        $token = config('app.telegram_bot_token', env('TELEGRAM_BOT_TOKEN'));
        $webhookController = app(\App\Http\Controllers\TelegramWebhookController::class);

        $daemon = $this->option('daemon');

        while (true) {
            try {
                $response = Http::timeout(60)->get("https://api.telegram.org/bot{$token}/getUpdates");
                
                if (!$response->successful()) {
                    $this->error('Failed to connect to Telegram API. Retrying in 5 seconds...');
                    sleep(5);
                    continue;
                }
            } catch (\Exception $e) {
                $this->error("Connection timeout or error: " . $e->getMessage() . " Retrying in 5 seconds...");
                sleep(5);
                continue;
            }

            $updates = $response->json()['result'] ?? [];
            $synced = 0;

            foreach ($updates as $update) {
                try {
                    if (isset($update['message'])) {
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

            if (!empty($updates)) {
                $lastUpdateId = end($updates)['update_id'];
                try {
                    Http::timeout(60)->get("https://api.telegram.org/bot{$token}/getUpdates", ['offset' => $lastUpdateId + 1]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('TelegramPoll Error acknowledging update', ['error' => $e->getMessage()]);
                }
                $this->info("Processed {$synced} updates.");
            }

            if (!$daemon) {
                break;
            }

            // Sleep for 2 seconds before next poll
            sleep(2);
        }

        if (!$daemon) {
            $this->info("Polling complete.");
        }
    }
}
