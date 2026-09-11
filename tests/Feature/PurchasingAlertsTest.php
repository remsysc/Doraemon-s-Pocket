<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventorySnapshot;
use App\Models\Lot;
use App\Models\Product;
use App\Models\ReorderConfig;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchasingAlertsTest extends TestCase
{
    use RefreshDatabase;

    public function test_reorder_alert_lists_skus_at_or_below_reorder_point(): void
    {
        // Low stock relative to an explicit reorder point -> alerted.
        $low = $this->makeProduct();
        $this->makeSnapshot($low, onHand: 2, available: 2);
        ReorderConfig::create([
            'sku_id' => $low->sku_id,
            'lead_time_days' => 7,
            'reorder_point' => 10,
            'safety_stock' => 0,
        ]);

        // Ample stock -> not alerted.
        $high = $this->makeProduct();
        $this->makeSnapshot($high, onHand: 100, available: 100);
        ReorderConfig::create([
            'sku_id' => $high->sku_id,
            'lead_time_days' => 7,
            'reorder_point' => 10,
            'safety_stock' => 0,
        ]);

        $response = $this->actingAs(User::factory()->purchasingManager()->create())
            ->getJson('/api/alerts/reorder')
            ->assertOk();

        $skuIds = collect($response->json('data'))->pluck('sku_id');
        $this->assertTrue($skuIds->contains($low->sku_id));
        $this->assertFalse($skuIds->contains($high->sku_id));
    }

    public function test_expiry_alert_lists_lots_within_window_with_stock(): void
    {
        $product = $this->makeProduct();
        $this->makeSnapshot($product, onHand: 5, available: 5);

        Lot::create([
            'sku_id' => $product->sku_id,
            'received_date' => now()->subDays(10),
            'expiry_date' => now()->addDays(10)->toDateString(),
            'bin_location' => 'A1',
        ]);

        $response = $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/alerts/expiry?days=30')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame($product->sku_id, $response->json('data.0.sku_id'));
    }

    public function test_expiry_alert_excludes_lots_without_stock(): void
    {
        $product = $this->makeProduct();
        $this->makeSnapshot($product, onHand: 0, available: 0);
        Lot::create([
            'sku_id' => $product->sku_id,
            'received_date' => now()->subDays(10),
            'expiry_date' => now()->addDays(5)->toDateString(),
            'bin_location' => 'A1',
        ]);

        $response = $this->actingAs(User::factory()->purchasingManager()->create())
            ->getJson('/api/alerts/expiry')
            ->assertOk();

        $this->assertCount(0, $response->json('data'));
    }

    public function test_classifications_readable_by_any_authenticated_role(): void
    {
        $this->makeProduct();

        foreach (['admin', 'purchasingManager', 'warehouseStaff'] as $role) {
            $this->actingAs(User::factory()->{$role}()->create())
                ->getJson('/api/inventory-classifications')
                ->assertOk()
                ->assertJsonStructure(['data']);
        }
    }

    public function test_classification_recompute_restricted_to_pm_and_admin(): void
    {
        $this->actingAs(User::factory()->warehouseStaff()->create())
            ->postJson('/api/inventory-classifications/recompute')
            ->assertForbidden();

        $this->actingAs(User::factory()->purchasingManager()->create())
            ->postJson('/api/inventory-classifications/recompute')
            ->assertOk();
    }

    public function test_seeder_creates_reorder_configs_for_all_catalog_products(): void
    {
        $this->seed();

        $this->assertDatabaseCount('reorder_configs', 8);
    }

    private function makeProduct(bool $seasonal = false): Product
    {
        $category = Category::create([
            'name' => 'Alert Category',
            'slug' => 'alert-'.fake()->unique()->numerify('####'),
        ]);

        return Product::create([
            'name' => 'Alert Product',
            'barcode' => 'AL-'.fake()->unique()->numerify('####'),
            'unit_of_measure' => 'unit',
            'is_seasonal' => $seasonal,
            'is_active' => true,
            'category_id' => $category->category_id,
        ]);
    }

    private function makeSnapshot(Product $product, int $onHand, int $available): InventorySnapshot
    {
        return InventorySnapshot::create([
            'sku_id' => $product->sku_id,
            'qty_on_hand' => $onHand,
            'qty_reserved' => $onHand - $available,
            'qty_available' => $available,
        ]);
    }
}
