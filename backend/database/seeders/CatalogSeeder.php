<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Component;
use App\Models\ProductImage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = __DIR__ . '/products-catalog.json';
        if (!File::exists($jsonPath)) {
            $this->command->error('products-catalog.json not found!');
            return;
        }

        $catalog = json_decode(File::get($jsonPath), true);
        if (!$catalog) {
            $this->command->error('Invalid JSON format!');
            return;
        }

        $sourceImagesDir = base_path('../images');
        $targetImagesDir = storage_path('app/public/products');

        if (!File::exists($targetImagesDir)) {
            File::makeDirectory($targetImagesDir, 0755, true);
        }

        $this->command->info('Clearing old data...');
        \Illuminate\Support\Facades\DB::table('product_components')->delete();
        \Illuminate\Support\Facades\DB::table('product_images')->delete();
        \Illuminate\Support\Facades\DB::table('products')->delete();

        $this->command->info('Seeding ' . count($catalog) . ' products...');

        foreach ($catalog as $item) {
            // Determine price
            $price = $item['dbPrice'] ?? $item['price'] ?? 50;

            // Determine preparation time
            $prepTime = $item['dbPreparationTime'] ?? 30;

            // Create Product
            $product = Product::create([
                'name' => $item['nameAr'] ?? $item['professionalName'] ?? 'بدون اسم',
                'name_en' => null, // We could extract English names if available
                'description' => $item['fullDescription'] ?? $item['designDescription'] ?? null,
                'category' => $item['dbCategory'] ?? 'bouquets',
                'price' => $price,
                'compare_at_price' => $item['dbCompareAtPrice'] ?? null,
                'occasions' => $item['occasions'] ?? [],
                'is_active' => true,
                'is_featured' => false,
                'preparation_time_minutes' => $prepTime,
                'sort_order' => 0
            ]);

            // Handle Images
            if (!empty($item['imageFiles']) && is_array($item['imageFiles'])) {
                foreach ($item['imageFiles'] as $index => $imgFile) {
                    $sourcePath = $sourceImagesDir . '/' . $item['folderPath'] . '/' . $imgFile;
                    $targetPath = $targetImagesDir . '/' . $imgFile;

                    if (File::exists($sourcePath)) {
                        File::copy($sourcePath, $targetPath);
                        ProductImage::create([
                            'product_id' => $product->id,
                            'image_url' => '/storage/products/' . $imgFile,
                            'is_primary' => $index === 0,
                            'sort_order' => $index + 1
                        ]);
                    } else {
                        $this->command->warn('Image not found: ' . $sourcePath);
                    }
                }
            }

            // Handle Components
            if (!empty($item['components']) && is_array($item['components'])) {
                $attachedComponentIds = [];
                foreach ($item['components'] as $compData) {
                    $compName = $compData['name'] ?? 'مكون غير معروف';
                    $quantity = $compData['count'] ?? 1;
                    $compName = trim($compData['name'] ?? 'مكون غير معروف');
                    $compColor = $compData['color'] ?? null;
                    $mapKey = $compName . '_' . $compColor;
                    
                    if (!isset($componentsMap[$mapKey])) {
                        $compType = $compData['type'] ?? 'flower';
                        $validCategories = ['flower', 'greens', 'container', 'wrapping', 'accessory', 'food', 'filler', 'gift_cards'];
                        $mappedType = in_array($compType, $validCategories) ? $compType : 'accessory';

                        $componentsMap[$mapKey] = Component::firstOrCreate(
                            ['name' => $compName, 'color' => $compColor],
                            [
                                'category' => $mappedType,
                                'stock_quantity' => 1000,
                                'cost_per_unit' => $compData['cost'] ?? 5.0,
                                'unit' => 'piece',
                                'is_active' => true
                            ]
                        );
                    }

                    $componentId = $componentsMap[$mapKey]->id;
                    $quantity = $compData['count'] ?? 1;

                    if (isset($attachedComponentIds[$componentId])) {
                        // update the quantity instead of attaching again
                        $attachedComponentIds[$componentId] += $quantity;
                    } else {
                        $attachedComponentIds[$componentId] = $quantity;
                    }
                }
                
                $syncData = [];
                foreach ($attachedComponentIds as $compId => $qty) {
                    $syncData[$compId] = ['quantity' => $qty];
                }
                $product->components()->sync($syncData);
            }
        }

        $this->command->info('Products seeded successfully!');
    }
}
