<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 20)->nullable()->unique()->after('email');
            $table->enum('role', ['customer', 'admin'])->default('customer')->after('phone');
            $table->enum('auth_provider', ['email', 'google', 'phone'])->default('email')->after('role');
            $table->string('avatar_url')->nullable()->after('auth_provider');
            $table->boolean('is_active')->default(true)->after('avatar_url');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->string('google_id')->nullable()->unique()->after('last_login_at');
            $table->string('phone_otp', 6)->nullable();
            $table->timestamp('phone_otp_expires_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'role', 'auth_provider', 'avatar_url', 'is_active',
                'last_login_at', 'google_id', 'phone_otp', 'phone_otp_expires_at']);
        });
    }
};
