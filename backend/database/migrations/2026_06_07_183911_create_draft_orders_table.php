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
        Schema::create('draft_orders', function (Blueprint $table) {
            $table->id();
            $table->string('token')->unique(); // The link token
            $table->string('customer_phone')->nullable();
            $table->string('customer_name')->nullable();
            $table->json('items'); // The selected products, quantity, unit_price, gift_messages
            $table->date('delivery_date')->nullable();
            $table->time('scheduled_time')->nullable();
            $table->enum('delivery_type', ['local', 'pickup'])->default('local');
            $table->enum('delivery_speed', ['standard', 'express'])->default('standard');
            $table->decimal('subtotal', 10, 2);
            $table->enum('status', ['draft', 'completed', 'expired'])->default('draft');
            $table->timestamp('expires_at')->nullable(); // Default 24h
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('draft_orders');
    }
};
