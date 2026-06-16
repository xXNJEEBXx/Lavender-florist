<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class WipeOldData extends Command
{
    protected $signature = 'app:wipe-old-data';
    protected $description = 'Safely truncates all products, orders, carts and related tables';

    public function handle()
    {
        $this->info('Starting to wipe old data...');

        Schema::disableForeignKeyConstraints();

        DB::table('gift_messages')->truncate();
        DB::table('coupon_usages')->truncate();
        DB::table('order_status_history')->truncate();
        DB::table('order_item_components')->truncate();
        DB::table('order_items')->truncate();
        DB::table('orders')->truncate();
        DB::table('cart_items')->truncate();
        DB::table('carts')->truncate();
        
        DB::table('product_images')->truncate();
        DB::table('product_components')->truncate();
        DB::table('products')->truncate();

        Schema::enableForeignKeyConstraints();

        $this->info('Old data wiped successfully!');
    }
}
