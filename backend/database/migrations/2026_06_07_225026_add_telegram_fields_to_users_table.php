<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'telegram_username')) {
                $table->string('telegram_username')->nullable()->after('phone_otp_expires_at');
            }
            if (!Schema::hasColumn('users', 'telegram_chat_id')) {
                $table->string('telegram_chat_id')->nullable()->after('telegram_username');
            }
            if (!Schema::hasColumn('users', 'telegram_notify_new_orders')) {
                $table->boolean('telegram_notify_new_orders')->default(true)->after('telegram_chat_id');
            }
            if (!Schema::hasColumn('users', 'telegram_notify_driver')) {
                $table->boolean('telegram_notify_driver')->default(false)->after('telegram_notify_new_orders');
            }
            if (!Schema::hasColumn('users', 'telegram_notify_website')) {
                $table->boolean('telegram_notify_website')->default(true)->after('telegram_notify_driver');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = ['telegram_username', 'telegram_chat_id', 'telegram_notify_new_orders', 'telegram_notify_driver', 'telegram_notify_website'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
