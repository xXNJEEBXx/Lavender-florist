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
        DB::statement("ALTER TABLE orders MODIFY COLUMN delivery_type ENUM('local', 'shipping', 'pickup') DEFAULT 'local'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE orders MODIFY COLUMN delivery_type ENUM('local', 'shipping') DEFAULT 'local'");
    }
};
