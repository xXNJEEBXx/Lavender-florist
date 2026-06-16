<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Component;
use Illuminate\Support\Facades\File;

class ComponentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = __DIR__ . '/components-catalog.json';
        if (!File::exists($jsonPath)) {
            $this->command->error('components-catalog.json not found!');
            return;
        }

        $catalog = json_decode(File::get($jsonPath), true);
        if (!$catalog) {
            $this->command->error('Invalid JSON format in components-catalog.json!');
            return;
        }

        $this->command->info('Seeding ' . count($catalog) . ' components...');

        foreach ($catalog as $key => $item) {
            $compName = trim($item['nameAr'] ?? 'مكون غير معروف');
            $compType = $item['type'] ?? 'flower';
            $validCategories = ['flower', 'greens', 'container', 'wrapping', 'accessory', 'food', 'filler', 'gift_cards'];
            $mappedType = in_array($compType, $validCategories) ? $compType : 'accessory';

            Component::updateOrCreate(
                [
                    'name' => $compName,
                    'color' => $item['color'] ?? null
                ],
                [
                    'name_en' => $item['nameEn'] ?? null,
                    'category' => $mappedType,
                    'unit' => 'piece', // Defaulting unit to piece
                    'cost_per_unit' => $item['price'] ?? 5.0,
                    'stock_quantity' => 1000,
                    'min_stock_alert' => 20,
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Components seeded successfully!');
    }
}
