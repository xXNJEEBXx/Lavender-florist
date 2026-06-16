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
        User::updateOrCreate(
            ['email' => 'admin@lavender.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        // Create Njeeb Admin User
        User::updateOrCreate(
            ['email' => 'xxnjeebxx@gmail.com'],
            [
                'name' => 'NJEEB ALMUSAWI',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        // Create Default Customer
        User::updateOrCreate(
            ['email' => 'customer@lavender.com'],
            [
                'name' => 'Test Customer',
                'password' => Hash::make('password'),
                'role' => 'customer',
                'is_active' => true,
                'phone' => '+966500000000',
            ]
        );

        // Seed All Components
        $this->call(ComponentSeeder::class);

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
