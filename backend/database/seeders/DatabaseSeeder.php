<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Component;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\WorkingHours;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@lavender.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        // Create Default Customer
        User::create([
            'name' => 'Test Customer',
            'email' => 'customer@lavender.com',
            'password' => Hash::make('password'),
            'role' => 'customer',
            'is_active' => true,
            'phone' => '+966500000000',
        ]);

        // Create Some Components
        $redRose = Component::create([
            'name' => 'ورد جوري أحمر',
            'name_en' => 'Red Rose',
            'category' => 'flower',
            'color' => '#ff0000',
            'unit' => 'piece',
            'cost_per_unit' => 2.50,
            'stock_quantity' => 100,
            'min_stock_alert' => 20,
        ]);

        $whiteLily = Component::create([
            'name' => 'زنبق أبيض',
            'name_en' => 'White Lily',
            'category' => 'flower',
            'color' => '#ffffff',
            'unit' => 'piece',
            'cost_per_unit' => 5.00,
            'stock_quantity' => 50,
            'min_stock_alert' => 10,
        ]);

        $wrappingPaper = Component::create([
            'name' => 'تغليف أسود فاخر',
            'name_en' => 'Luxury Black Wrapping',
            'category' => 'wrapping',
            'color' => '#000000',
            'unit' => 'meter',
            'cost_per_unit' => 3.00,
            'stock_quantity' => 200,
            'min_stock_alert' => 50,
        ]);

        // Create a Product
        $product = Product::create([
            'name' => 'باقة الحب الأبدي',
            'name_en' => 'Eternal Love Bouquet',
            'description' => 'باقة رائعة من الورد الجوري الأحمر تغلف باللون الأسود الفاخر لتعبر عن أصدق المشاعر',
            'category' => 'bouquets',
            'occasion' => 'love',
            'price' => 150.00,
            'is_active' => true,
            'is_featured' => true,
            'preparation_time_minutes' => 30,
        ]);

        // Attach Components to Product
        $product->components()->attach([
            $redRose->id => ['quantity' => 12],
            $wrappingPaper->id => ['quantity' => 2],
        ]);

        // Create Default Store Settings
        StoreSetting::create(['key' => 'delivery_fee', 'value' => 15.00]);
        StoreSetting::create(['key' => 'tax_percentage', 'value' => 15]);

        // Create Default Working Hours (Sat-Thu 9AM - 10PM, Fri 4PM - 10PM)
        for ($i = 0; $i <= 6; $i++) {
            WorkingHours::create([
                'type' => 'regular',
                'day_of_week' => $i,
                'open_time' => $i === 5 ? '16:00' : '09:00', // Friday is 5
                'close_time' => '22:00',
            ]);
        }
    }
}
