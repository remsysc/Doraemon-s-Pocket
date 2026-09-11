<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventorySnapshot;
use App\Models\InventoryTransaction;
use App\Models\Lot;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_the_complete_demo_catalog(): void
    {
        $this->seed();

        $this->assertDatabaseCount('categories', 4);
        $this->assertDatabaseCount('products', 8);
        $this->assertDatabaseCount('lots', 16);
        $this->assertDatabaseCount('inventory_transactions', 26);
        $this->assertSame(26, InventoryTransaction::query()->count());
        $this->assertSame(4, Category::query()->count());
        $this->assertSame(8, Product::query()->count());
        $this->assertSame(16, Lot::query()->count());
        $this->assertDatabaseHas('categories', [
            'slug' => 'air-conditioning-units',
        ]);
        $this->assertDatabaseHas('products', [
            'barcode' => 'WB-AC-1000',
            'is_seasonal' => true,
        ]);
        $this->assertDatabaseHas('lots', [
            'bin_location' => 'FL-A01',
        ]);
    }

    public function test_database_seeder_is_safe_to_run_again(): void
    {
        $this->seed();
        $this->seed();

        $this->assertDatabaseCount('categories', 4);
        $this->assertDatabaseCount('products', 8);
        $this->assertDatabaseCount('lots', 16);
        $this->assertDatabaseCount('inventory_transactions', 26);
        $this->assertSame(26, InventoryTransaction::query()->count());
        $this->assertDatabaseCount('inventory_snapshots', 8);
    }

    public function test_database_seeder_rebuilds_snapshots_from_the_ledger(): void
    {
        $this->seed();

        // Every catalog product has a derived snapshot; none are left empty.
        $this->assertDatabaseCount('inventory_snapshots', 8);

        // WB-AC-1000: RECEIPT +48, RECEIPT +36, SALE -6, RESERVE -4
        // => on_hand 78, reserved 4, available 74.
        $product = Product::query()->where('barcode', 'WB-AC-1000')->firstOrFail();
        $this->assertDatabaseHas('inventory_snapshots', [
            'sku_id' => $product->sku_id,
            'qty_on_hand' => 78,
            'qty_reserved' => 4,
            'qty_available' => 74,
        ]);

        // The rebuild never violates the snapshot invariants.
        InventorySnapshot::query()->each(function (InventorySnapshot $snapshot): void {
            $this->assertGreaterThanOrEqual(0, $snapshot->qty_on_hand);
            $this->assertGreaterThanOrEqual(0, $snapshot->qty_reserved);
            $this->assertGreaterThanOrEqual(0, $snapshot->qty_available);
            $this->assertSame(
                $snapshot->qty_on_hand - $snapshot->qty_reserved,
                $snapshot->qty_available,
            );
        });
    }

    public function test_database_seeding_does_not_create_audit_logs(): void
    {
        $this->seed();

        $this->assertDatabaseCount('audit_logs', 0);
    }
}
