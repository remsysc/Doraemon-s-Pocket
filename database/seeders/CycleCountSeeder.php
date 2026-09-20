<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\CycleCount;
use App\Models\InventorySnapshot;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class CycleCountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get demo users
        $warehouseStaff = User::where('email', 'warehouse@test.com')->first();
        $admin = User::where('email', 'admin@test.com')->first();

        // Get thermostat product (SKU for demo shrinkage case)
        $thermostat = Product::where('name', 'like', '%Thermostat%')->first();

        if (! $thermostat || ! $warehouseStaff || ! $admin) {
            $this->command->warn('Demo data not found. Skipping cycle count seeder.');

            return;
        }

        // Get snapshot for thermostat
        $snapshot = InventorySnapshot::where('sku_id', $thermostat->sku_id)->first();

        if (! $snapshot) {
            $this->command->warn('No snapshot found for thermostat. Skipping cycle count seeder.');

            return;
        }

        // Thermostat shrinkage demo case:
        // - Expected: 45 units (snapshot qty_on_hand)
        // - Counted: 12 units (physical count shows shrinkage)
        // - Variance: -33 units, -73.33% (flagged)
        $thermostatCount = CycleCount::create([
            'sku_id' => $thermostat->sku_id,
            'lot_id' => null,
            'counted_by' => $warehouseStaff->id,
            'counter_name' => $warehouseStaff->name,
            'expected_qty' => $snapshot->qty_on_hand,
            'counted_qty' => 12,
            'variance_qty' => 12 - $snapshot->qty_on_hand,
            'variance_pct' => $snapshot->qty_on_hand > 0
                ? round(((12 - $snapshot->qty_on_hand) / $snapshot->qty_on_hand) * 100, 2)
                : 100.0,
            'is_flagged' => true,
            'status' => 'pending',
            'notes' => 'Physical count during warehouse audit: 12 units vs expected 45 units.',
            'counted_at' => now()->subDays(2),
        ]);

        // Create another pending count for a different product
        $thermostat2 = Product::where('name', 'like', '%Thermostat%')->skip(1)->first();
        if ($thermostat2) {
            $snapshot2 = InventorySnapshot::where('sku_id', $thermostat2->sku_id)->first();
            if ($snapshot2) {
                CycleCount::create([
                    'sku_id' => $thermostat2->sku_id,
                    'lot_id' => null,
                    'counted_by' => $warehouseStaff->id,
                    'counter_name' => $warehouseStaff->name,
                    'expected_qty' => $snapshot2->qty_on_hand,
                    'counted_qty' => $snapshot2->qty_on_hand, // Exact match
                    'variance_qty' => 0,
                    'variance_pct' => 0.0,
                    'is_flagged' => false,
                    'status' => 'pending',
                    'notes' => 'Regular monthly count - no discrepancy.',
                    'counted_at' => now()->subDays(1),
                ]);
            }
        }

        // Create some reconciled counts for variance report demo
        $this->createReconciledCount($thermostat, $admin, 42, 'Minor variance - stock adjustment made.');
        $this->createReconciledCount($thermostat, $admin, 45, 'Exact match after audit correction.');

        $this->command->info('Cycle count seeder completed.');
    }

    /**
     * Create a reconciled cycle count.
     */
    private function createReconciledCount(Product $product, User $admin, int $countedQty, string $notes): void
    {
        $snapshot = InventorySnapshot::where('sku_id', $product->sku_id)->first();
        if (! $snapshot) {
            return;
        }

        $expectedQty = $snapshot->qty_on_hand;
        $varianceQty = $countedQty - $expectedQty;
        $variancePct = $expectedQty > 0 ? round((($countedQty - $expectedQty) / $expectedQty) * 100, 2) : 0.0;

        CycleCount::create([
            'sku_id' => $product->sku_id,
            'lot_id' => null,
            'counted_by' => $admin->id,
            'counter_name' => $admin->name,
            'expected_qty' => $expectedQty,
            'counted_qty' => $countedQty,
            'variance_qty' => $varianceQty,
            'variance_pct' => $variancePct,
            'is_flagged' => abs($variancePct) > 5.0,
            'status' => 'reconciled',
            'notes' => $notes,
            'reconciled_by' => $admin->id,
            'reconciled_at' => now()->subDays(3),
            // reconciliation_txn_id is a real ADJUSTMENT UUID in production;
            // the demo leaves it null to avoid fabricating ledger rows.
            'counted_at' => now()->subDays(5),
        ]);
    }
}
