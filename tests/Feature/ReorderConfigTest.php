<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ReorderConfig;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReorderConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_purchasing_manager_and_admin_can_list_reorder_configs(): void
    {
        $this->makeConfig();

        foreach (['purchasingManager', 'admin'] as $role) {
            $this->actingAs(User::factory()->{$role}()->create())
                ->getJson('/api/reorder-configs')
                ->assertOk()
                ->assertJsonStructure(['data', 'meta', 'links']);
        }
    }

    public function test_warehouse_staff_cannot_access_reorder_configs(): void
    {
        $config = $this->makeConfig();
        $ws = User::factory()->warehouseStaff()->create();

        $this->actingAs($ws)->getJson('/api/reorder-configs')->assertForbidden();
        $this->actingAs($ws)
            ->getJson("/api/reorder-configs/{$config->sku_id}")
            ->assertForbidden();
        $this->actingAs($ws)
            ->postJson('/api/reorder-configs', ['sku_id' => $config->sku_id, 'lead_time_days' => 5])
            ->assertForbidden();
        $this->actingAs($ws)
            ->getJson('/api/alerts/reorder')
            ->assertForbidden();
        $this->actingAs($ws)
            ->getJson('/api/alerts/expiry')
            ->assertForbidden();
    }

    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/api/reorder-configs')->assertUnauthorized();
        $this->getJson('/api/alerts/reorder')->assertUnauthorized();
    }

    public function test_purchasing_manager_can_create_and_update_a_config(): void
    {
        $product = $this->makeProduct();
        $pm = User::factory()->purchasingManager()->create();

        $this->actingAs($pm)
            ->postJson('/api/reorder-configs', [
                'sku_id' => $product->sku_id,
                'lead_time_days' => 7,
                'safety_stock' => 3,
                'order_cost' => 500,
                'holding_cost_per_unit' => 40,
            ])
            ->assertCreated()
            ->assertJsonPath('data.sku_id', $product->sku_id)
            ->assertJsonPath('data.lead_time_days', 7);

        $config = ReorderConfig::query()->find($product->sku_id);

        $this->actingAs($pm)
            ->putJson("/api/reorder-configs/{$config->sku_id}", ['lead_time_days' => 10])
            ->assertOk()
            ->assertJsonPath('data.lead_time_days', 10);

        $this->actingAs($pm)
            ->deleteJson("/api/reorder-configs/{$config->sku_id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('reorder_configs', ['sku_id' => $product->sku_id]);
    }

    public function test_store_rejects_duplicate_and_invalid_costs(): void
    {
        $config = $this->makeConfig();
        $pm = User::factory()->purchasingManager()->create();

        // Duplicate sku_id.
        $this->actingAs($pm)
            ->postJson('/api/reorder-configs', ['sku_id' => $config->sku_id, 'lead_time_days' => 5])
            ->assertStatus(422)
            ->assertJsonValidationErrors('sku_id');

        // Non-positive holding cost.
        $product = $this->makeProduct();
        $this->actingAs($pm)
            ->postJson('/api/reorder-configs', [
                'sku_id' => $product->sku_id,
                'lead_time_days' => 5,
                'holding_cost_per_unit' => 0,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('holding_cost_per_unit');
    }

    private function makeProduct(bool $seasonal = false): Product
    {
        $category = Category::create([
            'name' => 'Reorder Category',
            'slug' => 'reorder-'.fake()->unique()->numerify('####'),
        ]);

        return Product::create([
            'name' => 'Reorder Product',
            'barcode' => 'RC-'.fake()->unique()->numerify('####'),
            'unit_of_measure' => 'unit',
            'is_seasonal' => $seasonal,
            'is_active' => true,
            'category_id' => $category->category_id,
        ]);
    }

    private function makeConfig(): ReorderConfig
    {
        return ReorderConfig::create([
            'sku_id' => $this->makeProduct()->sku_id,
            'lead_time_days' => 7,
            'service_level_z' => 1.65,
        ]);
    }
}
