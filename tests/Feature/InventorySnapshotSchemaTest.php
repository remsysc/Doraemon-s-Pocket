<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventorySnapshot;
use App\Models\Product;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class InventorySnapshotSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_snapshots_table_has_the_expected_schema(): void
    {
        $this->assertTrue(Schema::hasTable("inventory_snapshots"));
        $this->assertTrue(Schema::hasColumns("inventory_snapshots", [
            "sku_id",
            "qty_on_hand",
            "qty_reserved",
            "qty_available",
            "created_at",
            "updated_at",
        ]));
    }

    public function test_snapshot_defaults_quantities_to_zero_and_belongs_to_product(): void
    {
        $product = $this->makeProduct();

        $snapshot = InventorySnapshot::create([
            "sku_id" => $product->sku_id,
        ]);

        $this->assertSame(0, $snapshot->qty_on_hand);
        $this->assertSame(0, $snapshot->qty_reserved);
        $this->assertSame(0, $snapshot->qty_available);
        $this->assertSame($product->sku_id, $snapshot->product->sku_id);
        $this->assertSame($snapshot->sku_id, $product->fresh()->snapshot->sku_id);
    }

    public function test_snapshot_rejects_negative_quantities_on_postgresql(): void
    {
        if (DB::getDriverName() !== "pgsql") {
            $this->markTestSkipped("Snapshot check constraints are PostgreSQL-specific.");
        }

        $this->expectException(QueryException::class);

        InventorySnapshot::create([
            "sku_id" => $this->makeProduct()->sku_id,
            "qty_on_hand" => -1,
        ]);
    }

    public function test_snapshot_rejects_available_quantity_mismatch_on_postgresql(): void
    {
        if (DB::getDriverName() !== "pgsql") {
            $this->markTestSkipped("Snapshot check constraints are PostgreSQL-specific.");
        }

        $this->expectException(QueryException::class);

        InventorySnapshot::create([
            "sku_id" => $this->makeProduct()->sku_id,
            "qty_on_hand" => 10,
            "qty_reserved" => 2,
            "qty_available" => 10,
        ]);
    }

    private function makeProduct(): Product
    {
        $category = Category::create([
            "name" => "Snapshot Category",
            "slug" => "snapshot-category-" . fake()->unique()->numerify("####"),
        ]);

        return Product::create([
            "name" => "Snapshot Product",
            "barcode" => "SNAP-" . fake()->unique()->numerify("####"),
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "is_active" => true,
            "category_id" => $category->category_id,
        ]);
    }
}
