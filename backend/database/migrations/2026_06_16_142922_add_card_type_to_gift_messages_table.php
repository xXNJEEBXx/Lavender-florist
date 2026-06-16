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
        Schema::table('gift_messages', function (Blueprint $table) {
            $table->string('card_type')->nullable()->default('white');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gift_messages', function (Blueprint $table) {
            $table->dropColumn('card_type');
        });
    }
};
