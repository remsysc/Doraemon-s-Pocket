<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Lot;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            [
                'name' => 'Air Conditioning Units',
                'slug' => 'air-conditioning-units',
                'description' => 'Portable and window air-conditioning units.',
                'products' => [
                    [
                        'name' => 'Portable AC 1.0 HP',
                        'barcode' => 'WB-AC-1000',
                        'unit_of_measure' => 'unit',
                        'is_seasonal' => true,
                        'shelf_life_days' => null,
                        'lots' => [
                            ['bin_location' => 'AC-A01', 'expiry_date' => null],
                            ['bin_location' => 'AC-A02', 'expiry_date' => null],
                        ],
                    ],
                    [
                        'name' => 'Window AC 1.5 HP',
                        'barcode' => 'WB-AC-1500',
                        'unit_of_measure' => 'unit',
                        'is_seasonal' => true,
                        'shelf_life_days' => null,
                        'lots' => [
                            ['bin_location' => 'AC-B01', 'expiry_date' => null],
                            ['bin_location' => 'AC-B02', 'expiry_date' => null],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Air Purifiers',
                'slug' => 'air-purifiers',
                'description' => 'Air purification units for residential use.',
                'products' => [
                    [
                        'name' => 'HEPA Air Purifier Small',
                        'barcode' => 'WB-AP-0100',
                        'unit_of_measure' => 'unit',
                        'is_seasonal' => false,
                        'shelf_life_days' => null,
                        'lots' => [
                            ['bin_location' => 'AP-A01', 'expiry_date' => null],
                            ['bin_location' => 'AP-A02', 'expiry_date' => null],
                        ],
                    ],
                    [
                        'name' => 'HEPA Air Purifier Large',
                        'barcode' => 'WB-AP-0200',
                        'unit_of_measure' => 'unit',
                        'is_seasonal' => false,
                        'shelf_life_days' => null,
                        'lots' => [
                            ['bin_location' => 'AP-B01', 'expiry_date' => null],
                            ['bin_location' => 'AP-B02', 'expiry_date' => null],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Air Purifier Filters',
                'slug' => 'air-purifier-filters',
                'description' => 'Replacement filters and filter kits for air purifiers.',
                'products' => [
                    [
                        'name' => 'HEPA Replacement Filter Small',
                        'barcode' => 'WB-FL-0100',
                        'unit_of_measure' => 'piece',
                        'is_seasonal' => false,
                        'shelf_life_days' => 730,
                        'lots' => [
                            ['bin_location' => 'FL-A01', 'expiry_date' => '+180 days'],
                            ['bin_location' => 'FL-A02', 'expiry_date' => '+365 days'],
                        ],
                    ],
                    [
                        'name' => 'HEPA Replacement Filter Large',
                        'barcode' => 'WB-FL-0200',
                        'unit_of_measure' => 'piece',
                        'is_seasonal' => false,
                        'shelf_life_days' => 730,
                        'lots' => [
                            ['bin_location' => 'FL-B01', 'expiry_date' => '+120 days'],
                            ['bin_location' => 'FL-B02', 'expiry_date' => '+300 days'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Thermostats',
                'slug' => 'thermostats',
                'description' => 'Digital thermostats and temperature controllers.',
                'products' => [
                    [
                        'name' => 'Digital Smart Thermostat',
                        'barcode' => 'WB-TH-0100',
                        'unit_of_measure' => 'unit',
                        'is_seasonal' => false,
                        'shelf_life_days' => null,
                        'lots' => [
                            ['bin_location' => 'TH-A01', 'expiry_date' => null],
                            ['bin_location' => 'TH-A02', 'expiry_date' => null],
                        ],
                    ],
                    [
                        'name' => 'Programmable Thermostat',
                        'barcode' => 'WB-TH-0200',
                        'unit_of_measure' => 'unit',
                        'is_seasonal' => false,
                        'shelf_life_days' => null,
                        'lots' => [
                            ['bin_location' => 'TH-B01', 'expiry_date' => null],
                            ['bin_location' => 'TH-B02', 'expiry_date' => null],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($catalog as $categoryData) {
            $products = $categoryData['products'];
            unset($categoryData['products']);

            $category = Category::updateOrCreate(
                ['slug' => $categoryData['slug']],
                $categoryData,
            );

            foreach ($products as $productData) {
                $lots = $productData['lots'];
                unset($productData['lots']);

                $product = Product::updateOrCreate(
                    ['barcode' => $productData['barcode']],
                    [...$productData, 'category_id' => $category->category_id, 'is_active' => true],
                );

                foreach ($lots as $lotData) {
                    $expiryDate = $lotData['expiry_date'];
                    unset($lotData['expiry_date']);

                    Lot::updateOrCreate(
                        [
                            'sku_id' => $product->sku_id,
                            'bin_location' => $lotData['bin_location'],
                        ],
                        [
                            ...$lotData,
                            'received_date' => now()->subDays(7),
                            'expiry_date' => $expiryDate === null ? null : now()->modify($expiryDate)->toDateString(),
                        ],
                    );
                }
            }
        }
    }
}
