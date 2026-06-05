<?php

namespace Database\Seeders;

use App\Models\WorkingHours;
use Illuminate\Database\Seeder;

class WorkingHoursSeeder extends Seeder
{
    public function run(): void
    {
        $days = [
            ['day_of_week' => 0, 'open_time' => '09:00', 'close_time' => '22:00'],
            ['day_of_week' => 1, 'open_time' => '09:00', 'close_time' => '22:00'],
            ['day_of_week' => 2, 'open_time' => '09:00', 'close_time' => '22:00'],
            ['day_of_week' => 3, 'open_time' => '09:00', 'close_time' => '22:00'],
            ['day_of_week' => 4, 'open_time' => '09:00', 'close_time' => '22:00'],
            ['day_of_week' => 5, 'open_time' => '16:00', 'close_time' => '22:00'],
            ['day_of_week' => 6, 'open_time' => '09:00', 'close_time' => '22:00'],
        ];

        foreach ($days as $d) {
            WorkingHours::updateOrCreate(
                ['type' => 'regular', 'day_of_week' => $d['day_of_week']],
                ['open_time' => $d['open_time'], 'close_time' => $d['close_time'], 'is_active' => true]
            );
        }
    }
}
