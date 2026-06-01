<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique(); // LF-YYYYMMDD-NNN
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', [
                'pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'
            ])->default('pending');
            // Delivery
            $table->enum('delivery_type', ['local', 'shipping'])->default('local');
            $table->foreignId('address_id')->nullable()->constrained('addresses')->nullOnDelete();
            $table->date('delivery_date')->nullable();
            $table->enum('delivery_time_slot', ['morning', 'afternoon', 'evening'])->nullable();
            $table->decimal('delivery_fee', 8, 2)->default(15.00);
            $table->timestamp('estimated_delivery_at')->nullable();
            $table->text('driver_notes')->nullable();
            // Pricing
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->foreignId('coupon_id')->nullable()->constrained('coupons')->nullOnDelete();
            $table->decimal('total', 10, 2)->default(0);
            // Payment
            $table->enum('payment_method', ['cash_on_delivery', 'bank_transfer'])->default('cash_on_delivery');
            $table->enum('payment_status', ['pending', 'paid', 'refunded'])->default('pending');
            $table->string('bank_transfer_receipt')->nullable();
            // Extra
            $table->text('notes')->nullable();
            $table->unsignedSmallInteger('estimated_preparation_time')->default(45); // minutes
            $table->unsignedSmallInteger('queue_position')->default(0);
            // Timestamps
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('preparing_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('delivering_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['customer_id', 'status']);
            $table->index(['status', 'created_at']);
            $table->index('delivery_date');
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name'); // snapshot at order time
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->timestamps();

            $table->index('order_id');
        });

        Schema::create('order_item_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('component_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('quantity');
            $table->enum('status', ['reserved', 'consumed', 'released'])->default('reserved');

            $table->index(['order_item_id', 'status']);
        });

        Schema::create('order_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('order_id');
        });

        Schema::create('gift_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('sender_name')->nullable();
            $table->string('recipient_name')->nullable();
            $table->text('message')->nullable();
            $table->foreignId('card_component_id')->nullable()->constrained('components')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('coupon_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->timestamp('used_at')->useCurrent();

            $table->index(['coupon_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_usages');
        Schema::dropIfExists('gift_messages');
        Schema::dropIfExists('order_status_history');
        Schema::dropIfExists('order_item_components');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
