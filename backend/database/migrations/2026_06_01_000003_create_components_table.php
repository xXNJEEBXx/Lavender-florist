<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('components', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->enum('category', ['flower', 'greens', 'wrapping', 'accessories', 'gift_cards'])->default('flower');
            $table->string('color', 7)->nullable(); // hex color
            $table->string('image_url')->nullable();
            $table->enum('unit', ['piece', 'branch', 'meter', 'item'])->default('piece');
            $table->decimal('cost_per_unit', 10, 2)->default(0);
            $table->unsignedInteger('stock_quantity')->default(0);
            $table->unsignedInteger('min_stock_alert')->default(10);
            $table->string('supplier')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('category');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('components');
    }
};
