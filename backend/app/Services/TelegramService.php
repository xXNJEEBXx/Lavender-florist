<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

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

        return Http::post("{$this->apiUrl}/editMessageText", $payload)->json();
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
}
