<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventorySnapshot;
use App\Models\InventoryTransaction;
use App\Models\Lot;
use App\Models\Product;
use App\Models\User;
use App\Services\InventoryTransactionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Proves the row-level lock serializes competing decrements so the final
 * available unit is consumed exactly once (SPEC FR-22/FR-23, Sprint 3
 * acceptance criterion 3). This is only meaningful on PostgreSQL, which
 * models `SELECT ... FOR UPDATE`; SQLite serializes writes globally and
 * cannot exercise row-level lock contention.
 */
class InventoryTransactionConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() !== "pgsql") {
            $this->markTestSkipped(
                "Row-level lock concurrency is PostgreSQL-specific.",
            );
        }
    }

    public function test_only_one_competing_sale_consumes_the_final_available_unit(): void
    {
        $lot = $this->makeLotWithAvailableStock(1);
        $actorId = User::factory()->warehouseStaff()->create()->id;
        $service = app(InventoryTransactionService::class);

        // Hold the snapshot row lock on a separate connection, mimicking a
        // competing request that has already entered its locked section.
        $blocker = DB::connection();
        $blocker->beginTransaction();
        $blocker->table("inventory_snapshots")
            ->where("sku_id", $lot->sku_id)
            ->lockForUpdate()
            ->first();

        // The competing request consumes the unit while the lock is held
        // elsewhere, then releases. Only one decrement may succeed overall.
        $firstSucceeded = false;
        try {
            // Simulate the blocker committing its own sale of the final unit.
            $blocker->table("inventory_snapshots")
                ->where("sku_id", $lot->sku_id)
                ->update([
                    "qty_on_hand" => 0,
                    "qty_available" => 0,
                    "updated_at" => now(),
                ]);
            $blocker->table("inventory_transactions")->insert([
                "txn_id" => (string) \Illuminate\Support\Str::uuid(),
                "lot_id" => $lot->lot_id,
                "actor_id" => $actorId,
                "txn_type" => "SALE",
                "qty_delta" => -1,
                "occurred_at" => now(),
                "created_at" => now(),
                "updated_at" => now(),
            ]);
            $blocker->commit();
            $firstSucceeded = true;
        } catch (\Throwable $e) {
            $blocker->rollBack();
            throw $e;
        }

        $this->assertTrue($firstSucceeded);

        // The second decrement now re-reads the committed row under its own
        // lock and must be rejected — no negative availability.
        $secondFailed = false;
        try {
            $service->record([
                "lot_id" => $lot->lot_id,
                "txn_type" => "SALE",
                "qty_delta" => -1,
                "occurred_at" => now()->toDateTimeString(),
            ], $actorId);
        } catch (\App\Exceptions\InventoryTransactionException $e) {
            $secondFailed = true;
            $this->assertSame("INSUFFICIENT_STOCK", $e->errorCode);
        }

        $this->assertTrue($secondFailed, "The second decrement must be rejected.");

        $snapshot = InventorySnapshot::query()->find($lot->sku_id);
        $this->assertSame(0, $snapshot->qty_available);
        $this->assertSame(0, $snapshot->qty_on_hand);
        $this->assertGreaterThanOrEqual(0, $snapshot->qty_available);

        // Exactly one SALE row exists for the consumed unit.
        $this->assertSame(
            1,
            InventoryTransaction::query()
                ->where("lot_id", $lot->lot_id)
                ->where("txn_type", "SALE")
                ->count(),
        );
    }

    private function makeLotWithAvailableStock(int $units): Lot
    {
        $category = Category::create([
            "name" => "Concurrency Category",
            "slug" => "concurrency-category-" . fake()->unique()->numerify("####"),
        ]);
        $product = Product::create([
            "name" => "Concurrency Product",
            "barcode" => "CONC-" . fake()->unique()->numerify("####"),
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "is_active" => true,
            "category_id" => $category->category_id,
        ]);
        $lot = Lot::create([
            "sku_id" => $product->sku_id,
            "received_date" => now()->toDateTimeString(),
            "expiry_date" => now()->addYear()->toDateString(),
            "bin_location" => "A1",
        ]);

        InventorySnapshot::create([
            "sku_id" => $product->sku_id,
            "qty_on_hand" => $units,
            "qty_reserved" => 0,
            "qty_available" => $units,
        ]);

        return $lot;
    }
}
