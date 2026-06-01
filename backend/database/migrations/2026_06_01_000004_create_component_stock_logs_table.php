<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('component_stock_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('component_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['addition', 'reservation', 'release', 'consumption', 'adjustment', 'damage']);
            $table->integer('quantity'); // positive=in, negative=out
            $table->unsignedInteger('stock_after'); // stock level after operation
            $table->nullableMorphs('reference'); // order, etc.
            $table->string('notes')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['component_id', 'created_at']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('component_stock_logs');
    }
};
