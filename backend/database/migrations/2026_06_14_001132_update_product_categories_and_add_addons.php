<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. Update Products Category Enum
        // First drop the default constraint if exists, then modify column
        DB::statement("ALTER TABLE products MODIFY COLUMN category ENUM('bouquets', 'boxes', 'vases', 'baskets', 'leis', 'bridal', 'gifts', 'fresh-flowers', 'add_ons', 'cards') DEFAULT 'bouquets'");
        
        // 2. Change occasion to JSON 'occasions'
        if (!Schema::hasColumn('products', 'occasions')) {
            Schema::table('products', function (Blueprint $table) {
                $table->json('occasions')->nullable()->after('compare_at_price');
            });
        }
        
        // Copy old occasion data to the new JSON column (optional but good practice)
        DB::statement("UPDATE products SET occasions = JSON_ARRAY(occasion) WHERE occasion IS NOT NULL");
        
        // Drop the old occasion column
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['category', 'occasion']); // The index has both
            $table->dropColumn('occasion');
            $table->index(['category']); // Recreate index for category
        });

        // 3. Add parent_id and options to cart_items and order_items for add-ons logic
        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('cart_id')->constrained('cart_items')->cascadeOnDelete();
            $table->json('options')->nullable()->after('quantity');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('order_id')->constrained('order_items')->cascadeOnDelete();
            $table->json('options')->nullable()->after('total_price');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['parent_id', 'options']);
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['parent_id', 'options']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->enum('occasion', ['love', 'wedding', 'graduation', 'congratulations', 'condolences', 'general'])->default('general')->after('compare_at_price');
            $table->dropIndex(['category']);
            $table->index(['category', 'occasion']);
        });
        
        DB::statement("UPDATE products SET occasion = JSON_UNQUOTE(JSON_EXTRACT(occasions, '$[0]')) WHERE occasions IS NOT NULL");
        
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('occasions');
        });

        DB::statement("ALTER TABLE products MODIFY COLUMN category ENUM('bouquets', 'boxes', 'table_arrangements', 'single_flowers', 'gift_sets', 'cards', 'gifts') DEFAULT 'bouquets'");
    }
};
