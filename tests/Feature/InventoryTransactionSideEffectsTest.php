<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventorySnapshot;
use App\Models\InventoryTransaction;
use App\Models\Lot;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTransactionSideEffectsTest extends TestCase
{
    use RefreshDatabase;

    public function test_receipt_creates_and_updates_a_snapshot(): void
    {
        $lot = $this->makeLot();
        $user = User::factory()->warehouseStaff()->create();

        $this->actingAs($user)
            ->postJson("/api/inventory-transactions", $this->payload($lot, "RECEIPT", 10))
            ->assertCreated();

        $this->assertSnapshot($lot, 10, 0, 10);
    }

    public function test_reserve_and_release_update_reserved_and_available_quantities(): void
    {
        $lot = $this->makeLot();
        $user = User::factory()->warehouseStaff()->create();

        $this->record($user, $lot, "RECEIPT", 10)->assertCreated();
        $this->record($user, $lot, "RESERVE", -4)->assertCreated();
        $this->assertSnapshot($lot, 10, 4, 6);

        $this->record($user, $lot, "RESERVE", 2)->assertCreated();
        $this->assertSnapshot($lot, 10, 2, 8);
    }

    public function test_pick_consumes_reserved_stock_without_changing_available_stock(): void
    {
        $lot = $this->makeLot();
        $user = User::factory()->warehouseStaff()->create();

        $this->record($user, $lot, "RECEIPT", 10)->assertCreated();
        $this->record($user, $lot, "RESERVE", -4)->assertCreated();
        $this->record($user, $lot, "PICK", -3)->assertCreated();

        $this->assertSnapshot($lot, 7, 1, 6);
    }

    public function test_sale_and_write_off_decrement_on_hand_and_available(): void
    {
        $lot = $this->makeLot();
        $user = User::factory()->warehouseStaff()->create();

        $this->record($user, $lot, "RECEIPT", 10)->assertCreated();
        $this->record($user, $lot, "SALE", -3)->assertCreated();
        $this->record($user, $lot, "WRITE_OFF", -2)->assertCreated();

        $this->assertSnapshot($lot, 5, 0, 5);
    }

    public function test_insufficient_sale_returns_422_and_rolls_back_snapshot_and_ledger(): void
    {
        $lot = $this->makeLot();
        $user = User::factory()->warehouseStaff()->create();

        $this->record($user, $lot, "RECEIPT", 2)->assertCreated();

        $this->record($user, $lot, "SALE", -3)
            ->assertUnprocessable()
            ->assertJson([
                "code" => "INSUFFICIENT_STOCK",
            ]);

        $this->assertSnapshot($lot, 2, 0, 2);
        $this->assertDatabaseCount("inventory_transactions", 1);
    }

    public function test_pick_without_reserved_stock_returns_422_and_rolls_back(): void
    {
        $lot = $this->makeLot();
        $user = User::factory()->warehouseStaff()->create();

        $this->record($user, $lot, "RECEIPT", 2)->assertCreated();

        $this->record($user, $lot, "PICK", -1)
            ->assertUnprocessable()
            ->assertJson([
                "code" => "INSUFFICIENT_RESERVED_STOCK",
            ]);

        $this->assertSnapshot($lot, 2, 0, 2);
        $this->assertDatabaseCount("inventory_transactions", 1);
    }

    public function test_invalid_transaction_sign_returns_422_without_creating_a_snapshot_or_ledger_row(): void
    {
        $lot = $this->makeLot();
        $user = User::factory()->warehouseStaff()->create();

        $this->record($user, $lot, "SALE", 1)
            ->assertUnprocessable()
            ->assertJson([
                "code" => "INVALID_QTY_DELTA",
            ]);

        $this->assertDatabaseCount("inventory_snapshots", 0);
        $this->assertDatabaseCount("inventory_transactions", 0);
    }

    private function record(User $user, Lot $lot, string $type, int $quantityDelta)
    {
        return $this->actingAs($user)->postJson(
            "/api/inventory-transactions",
            $this->payload($lot, $type, $quantityDelta),
        );
    }

    private function payload(Lot $lot, string $type, int $quantityDelta): array
    {
        return [
            "lot_id" => $lot->lot_id,
            "txn_type" => $type,
            "qty_delta" => $quantityDelta,
            "occurred_at" => now()->toDateTimeString(),
        ];
    }

    private function assertSnapshot(
        Lot $lot,
        int $onHand,
        int $reserved,
        int $available,
    ): void {
        $snapshot = InventorySnapshot::query()->find($lot->sku_id);

        $this->assertNotNull($snapshot);
        $this->assertSame($onHand, $snapshot->qty_on_hand);
        $this->assertSame($reserved, $snapshot->qty_reserved);
        $this->assertSame($available, $snapshot->qty_available);
    }

    private function makeLot(): Lot
    {
        $category = Category::create([
            "name" => "Transaction Category",
            "slug" => "transaction-category-" . fake()->unique()->numerify("####"),
        ]);
        $product = Product::create([
            "name" => "Transaction Product",
            "barcode" => "TXN-" . fake()->unique()->numerify("####"),
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "is_active" => true,
            "category_id" => $category->category_id,
        ]);

        return Lot::create([
            "sku_id" => $product->sku_id,
            "received_date" => now()->toDateTimeString(),
            "expiry_date" => now()->addYear()->toDateString(),
            "bin_location" => "A1",
        ]);
    }
}
