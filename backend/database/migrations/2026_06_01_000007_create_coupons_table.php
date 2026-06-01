<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('description')->nullable();
            $table->enum('type', [
                'percentage',         // خصم نسبة مئوية
                'fixed',              // خصم مبلغ ثابت
                'free_delivery',      // توصيل مجاني
                'delivery_discount',  // خصم جزئي على التوصيل
                'product_discount',   // خصم على منتج محدد
                'category_discount',  // خصم على تصنيف
            ])->default('percentage');
            $table->decimal('value', 10, 2)->default(0); // percentage or fixed amount
            $table->decimal('min_order_amount', 10, 2)->nullable();
            $table->decimal('max_discount_amount', 10, 2)->nullable(); // cap for percentage discounts
            $table->json('applicable_products')->nullable(); // product IDs
            $table->json('applicable_categories')->nullable(); // category slugs
            $table->unsignedInteger('usage_limit')->nullable(); // total uses allowed
            $table->unsignedTinyInteger('usage_per_customer')->default(1);
            $table->unsignedInteger('times_used')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
