<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ReorderConfig;
use Illuminate\Database\Seeder;
use RuntimeException;

class ReorderConfigSeeder extends Seeder
{
    /**
     * Seed repeatable per-SKU reorder configuration for the demo catalog.
     *
     * Seasonal AC units get no operational cost inputs (EOQ is not computed
     * for seasonal items). Non-seasonal items get order_cost and
     * holding_cost_per_unit so the demo shows a real EOQ suggestion. These
     * are operational costs, not unit price/valuation (OQ-6, FR-14).
     */
    public function run(): void
    {
        $configs = [
            // barcode => [lead_time_days, safety_stock|null, reorder_point|null, order_cost|null, holding_cost_per_unit|null, z]
            'WB-AC-1000' => ['lead_time_days' => 14, 'safety_stock' => null, 'reorder_point' => null, 'order_cost' => null, 'holding_cost_per_unit' => null, 'service_level_z' => 1.65],
            'WB-AC-1500' => ['lead_time_days' => 21, 'safety_stock' => null, 'reorder_point' => null, 'order_cost' => null, 'holding_cost_per_unit' => null, 'service_level_z' => 1.65],
            'WB-AP-0100' => ['lead_time_days' => 7, 'safety_stock' => 3, 'reorder_point' => null, 'order_cost' => 500.00, 'holding_cost_per_unit' => 40.00, 'service_level_z' => 1.65],
            'WB-AP-0200' => ['lead_time_days' => 10, 'safety_stock' => 2, 'reorder_point' => null, 'order_cost' => 500.00, 'holding_cost_per_unit' => 60.00, 'service_level_z' => 1.65],
            'WB-FL-0100' => ['lead_time_days' => 5, 'safety_stock' => 10, 'reorder_point' => null, 'order_cost' => 250.00, 'holding_cost_per_unit' => 8.00, 'service_level_z' => 1.65],
            'WB-FL-0200' => ['lead_time_days' => 5, 'safety_stock' => 8, 'reorder_point' => null, 'order_cost' => 250.00, 'holding_cost_per_unit' => 10.00, 'service_level_z' => 1.65],
            'WB-TH-0100' => ['lead_time_days' => 12, 'safety_stock' => 4, 'reorder_point' => null, 'order_cost' => 300.00, 'holding_cost_per_unit' => 25.00, 'service_level_z' => 1.65],
            'WB-TH-0200' => ['lead_time_days' => 12, 'safety_stock' => 4, 'reorder_point' => null, 'order_cost' => 300.00, 'holding_cost_per_unit' => 25.00, 'service_level_z' => 1.65],
        ];

        $skuByBarcode = Product::query()
            ->whereIn('barcode', array_keys($configs))
            ->pluck('sku_id', 'barcode');

        foreach ($configs as $barcode => $attributes) {
            $skuId = $skuByBarcode->get($barcode);

            if ($skuId === null) {
                throw new RuntimeException("Reorder demo seed references missing product barcode: {$barcode}.");
            }

            ReorderConfig::updateOrCreate(
                ['sku_id' => $skuId],
                $attributes,
            );
        }
    }
}
