<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('category', ['bouquets', 'boxes', 'table_arrangements', 'single_flowers', 'gift_sets'])->default('bouquets');
            $table->decimal('price', 10, 2); // VAT-inclusive
            $table->decimal('compare_at_price', 10, 2)->nullable();
            $table->enum('occasion', ['love', 'wedding', 'graduation', 'congratulations', 'condolences', 'general'])->default('general');
            $table->json('tags')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('preparation_time_minutes')->default(45);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'is_featured']);
            $table->index(['category', 'occasion']);
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
