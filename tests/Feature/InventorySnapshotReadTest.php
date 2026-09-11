<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventorySnapshot;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventorySnapshotReadTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_authenticated_roles_can_list_snapshots(): void
    {
        $this->makeSnapshot();

        foreach (["admin", "purchasingManager", "warehouseStaff"] as $role) {
            $this->actingAs(User::factory()->{$role}()->create())
                ->getJson("/api/inventory-snapshots")
                ->assertOk()
                ->assertJsonStructure(["data", "meta", "links"]);
        }
    }

    public function test_guest_cannot_list_snapshots(): void
    {
        $this->getJson("/api/inventory-snapshots")->assertUnauthorized();
    }

    public function test_index_returns_expected_snapshot_shape(): void
    {
        $snapshot = $this->makeSnapshot(12, 4, 8);

        $this->actingAs(User::factory()->warehouseStaff()->create())
            ->getJson("/api/inventory-snapshots")
            ->assertOk()
            ->assertJsonCount(1, "data")
            ->assertJsonPath("data.0.sku_id", $snapshot->sku_id)
            ->assertJsonPath("data.0.qty_on_hand", 12)
            ->assertJsonPath("data.0.qty_reserved", 4)
            ->assertJsonPath("data.0.qty_available", 8)
            ->assertJsonPath("data.0.product.id", $snapshot->sku_id);
    }

    public function test_show_returns_a_snapshot_by_sku(): void
    {
        $snapshot = $this->makeSnapshot(5, 0, 5);

        $this->actingAs(User::factory()->purchasingManager()->create())
            ->getJson("/api/inventory-snapshots/{$snapshot->sku_id}")
            ->assertOk()
            ->assertJsonPath("data.sku_id", $snapshot->sku_id)
            ->assertJsonPath("data.qty_available", 5);
    }

    public function test_guest_cannot_view_a_snapshot(): void
    {
        $snapshot = $this->makeSnapshot();

        $this->getJson("/api/inventory-snapshots/{$snapshot->sku_id}")
            ->assertUnauthorized();
    }

    public function test_snapshots_have_no_public_mutation_routes(): void
    {
        $snapshot = $this->makeSnapshot();
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->postJson("/api/inventory-snapshots", ["sku_id" => $snapshot->sku_id])
            ->assertStatus(405);

        $this->actingAs($admin)
            ->putJson("/api/inventory-snapshots/{$snapshot->sku_id}", [])
            ->assertStatus(405);

        $this->actingAs($admin)
            ->deleteJson("/api/inventory-snapshots/{$snapshot->sku_id}")
            ->assertStatus(405);
    }

    private function makeSnapshot(
        int $onHand = 0,
        int $reserved = 0,
        int $available = 0,
    ): InventorySnapshot {
        $category = Category::create([
            "name" => "Snapshot Read Category",
            "slug" => "snapshot-read-" . fake()->unique()->numerify("####"),
        ]);
        $product = Product::create([
            "name" => "Snapshot Read Product",
            "barcode" => "SNAPR-" . fake()->unique()->numerify("####"),
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "is_active" => true,
            "category_id" => $category->category_id,
        ]);

        return InventorySnapshot::create([
            "sku_id" => $product->sku_id,
            "qty_on_hand" => $onHand,
            "qty_reserved" => $reserved,
            "qty_available" => $available,
        ]);
    }
}
