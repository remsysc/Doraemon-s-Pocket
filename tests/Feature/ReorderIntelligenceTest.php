<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryTransaction;
use App\Models\Lot;
use App\Models\Product;
use App\Models\ReorderConfig;
use App\Models\User;
use App\Services\ClassificationService;
use App\Services\ReorderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ReorderIntelligenceTest extends TestCase
{
    use RefreshDatabase;

    private const WINDOW = 90;

    public function test_eoq_uses_the_textbook_formula_when_costs_are_present(): void
    {
        $service = new ReorderService(self::WINDOW);
        $config = new ReorderConfig([
            'order_cost' => 500,
            'holding_cost_per_unit' => 40,
        ]);

        // sqrt((2 * 3650 * 500) / 40) = sqrt(91250) ≈ 302.07
        $eoq = $service->eoq(3650.0, $config, false);

        $this->assertNotNull($eoq);
        $this->assertEqualsWithDelta(302.08, $eoq, 0.5);
    }

    public function test_eoq_is_null_for_seasonal_or_missing_costs(): void
    {
        $service = new ReorderService(self::WINDOW);

        $this->assertNull($service->eoq(3650.0, new ReorderConfig([
            'order_cost' => 500,
            'holding_cost_per_unit' => 40,
        ]), true), 'seasonal items have no EOQ');

        $this->assertNull($service->eoq(3650.0, new ReorderConfig([
            'order_cost' => 500,
        ]), false), 'missing holding cost yields null');

        $this->assertNull($service->eoq(3650.0, null, false), 'no config yields null');
    }

    public function test_rop_and_safety_stock_match_the_derived_formula(): void
    {
        // Put all demand on a single day so the series is deterministic:
        // one day = 90 units, the other 89 days = 0.
        $product = $this->makeProduct();
        $lot = $this->makeLot($product);
        $this->recordSale($lot, 90, daysAgo: 10);

        $config = ReorderConfig::create([
            'sku_id' => $product->sku_id,
            'lead_time_days' => 4,
            'service_level_z' => 1.65,
        ]);

        $metrics = (new ReorderService(self::WINDOW))->metricsFor($product->fresh(), $config);

        // mean = 90/90 = 1.0 per day.
        $this->assertEqualsWithDelta(1.0, $metrics['avg_daily_demand'], 0.0001);

        // population variance of [90, 0*89]: mean 1, var = ((89^2) + 89*(1)) / 90
        $mean = 1.0;
        $variance = ((90 - $mean) ** 2 + 89 * ((0 - $mean) ** 2)) / 90;
        $expectedSafety = (int) round(1.65 * sqrt(4 * $variance));
        $expectedRop = (int) round($mean * 4) + $expectedSafety;

        $this->assertSame($expectedSafety, $metrics['safety_stock']);
        $this->assertSame($expectedRop, $metrics['reorder_point']);
        $this->assertSame(round(1.0 * 365, 4), $metrics['annual_demand']);
    }

    public function test_config_overrides_take_precedence_over_derived_values(): void
    {
        $product = $this->makeProduct();
        $config = ReorderConfig::create([
            'sku_id' => $product->sku_id,
            'lead_time_days' => 7,
            'reorder_point' => 42,
            'safety_stock' => 9,
            'service_level_z' => 1.65,
        ]);

        $metrics = (new ReorderService(self::WINDOW))->metricsFor($product, $config);

        $this->assertSame(42, $metrics['reorder_point']);
        $this->assertSame(9, $metrics['safety_stock']);
    }

    public function test_seasonal_product_reports_seasonal_metrics(): void
    {
        $product = $this->makeProduct(seasonal: true);
        $config = ReorderConfig::create([
            'sku_id' => $product->sku_id,
            'lead_time_days' => 14,
            'order_cost' => 500,
            'holding_cost_per_unit' => 40,
        ]);

        $metrics = (new ReorderService(self::WINDOW))->metricsFor($product, $config);

        $this->assertTrue($metrics['seasonal']);
        $this->assertNull($metrics['eoq'], 'seasonal items get no EOQ even with costs');
        $this->assertContains($metrics['seasonal_basis'], ['last_year', 'insufficient_history']);
    }

    public function test_classification_ranks_high_volume_stable_demand_as_ax(): void
    {
        // High, steady demand product -> A (dominates volume) and X (low CV).
        $steady = $this->makeProduct();
        $lot = $this->makeLot($steady);
        for ($i = 1; $i <= self::WINDOW; $i++) {
            $this->recordSale($lot, 5, daysAgo: $i);
        }

        // A near-zero-demand product -> C and Z.
        $this->makeProduct();

        $classes = (new ClassificationService(self::WINDOW))->classifyAll();
        $steadyRow = $classes->firstWhere('sku_id', $steady->sku_id);

        $this->assertNotNull($steadyRow);
        $this->assertSame('A', $steadyRow['abc']);
        $this->assertSame('X', $steadyRow['xyz']);
    }

    private function makeProduct(bool $seasonal = false): Product
    {
        $category = Category::create([
            'name' => 'Intel Category',
            'slug' => 'intel-'.fake()->unique()->numerify('####'),
        ]);

        return Product::create([
            'name' => 'Intel Product',
            'barcode' => 'IN-'.fake()->unique()->numerify('####'),
            'unit_of_measure' => 'unit',
            'is_seasonal' => $seasonal,
            'is_active' => true,
            'category_id' => $category->category_id,
        ]);
    }

    private function makeLot(Product $product): Lot
    {
        return Lot::create([
            'sku_id' => $product->sku_id,
            'received_date' => now()->subDays(120),
            'expiry_date' => null,
            'bin_location' => 'A1',
        ]);
    }

    private function recordSale(Lot $lot, int $qty, int $daysAgo): void
    {
        InventoryTransaction::create([
            'lot_id' => $lot->lot_id,
            'actor_id' => User::factory()->warehouseStaff()->create()->id,
            'txn_type' => 'SALE',
            'qty_delta' => -abs($qty),
            'occurred_at' => Carbon::now()->subDays($daysAgo),
        ]);
    }
}
