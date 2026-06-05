<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$token = config('app.telegram_bot_token', env('TELEGRAM_BOT_TOKEN'));
$response = Illuminate\Support\Facades\Http::get("https://api.telegram.org/bot{$token}/getUpdates");
print_r($response->json());
