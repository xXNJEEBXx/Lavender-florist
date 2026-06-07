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
            $table->boolean('is_draft')->default(false)->after('id');
            $table->string('token')->nullable()->unique()->after('is_draft');
            $table->foreignId('customer_id')->nullable()->change();
        });

        Schema::dropIfExists('draft_orders');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['is_draft', 'token']);
            // We cannot easily revert customer_id to non-nullable if it contains nulls.
        });
    }
};
