<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gift_messages', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
            $table->dropUnique('gift_messages_order_id_unique');
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            
            $table->foreignId('order_item_id')->nullable()->constrained()->cascadeOnDelete()->after('order_id');
        });
    }

    public function down(): void
    {
        Schema::table('gift_messages', function (Blueprint $table) {
            $table->dropForeign(['order_item_id']);
            $table->dropColumn('order_item_id');
            // Re-adding unique constraint is tricky without dropping foreign key again
            $table->dropForeign(['order_id']);
            $table->unique('order_id');
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
        });
    }
};
