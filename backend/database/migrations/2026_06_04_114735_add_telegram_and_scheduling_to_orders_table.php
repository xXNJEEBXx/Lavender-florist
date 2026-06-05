<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete()->after('status');
            $table->timestamp('delivery_offered_at')->nullable()->after('delivering_at');
            $table->dateTime('scheduled_at')->nullable()->after('delivery_time_slot');
            $table->dateTime('ready_by')->nullable()->after('scheduled_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['driver_id']);
            $table->dropColumn(['driver_id', 'delivery_offered_at', 'scheduled_at', 'ready_by']);
        });
    }
};
