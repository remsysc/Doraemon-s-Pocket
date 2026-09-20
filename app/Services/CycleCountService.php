<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CycleCount;
use App\Models\InventorySnapshot;
use App\Models\Lot;
use App\Models\Product;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class CycleCountService
{
    /**
     * Record a new cycle count.
     *
     * @param  array{sku_id: string, lot_id?: string|null, counted_qty: int, counted_by: int, counter_name: string, notes?: string|null}  $data
     */
    public function recordCount(array $data): CycleCount
    {
        $product = Product::query()->findOrFail($data['sku_id']);
        $snapshot = InventorySnapshot::query()->where('sku_id', $data['sku_id'])->first();

        // Expected quantity is the snapshot's qty_on_hand at count time
        $expectedQty = $snapshot?->qty_on_hand ?? 0;
        $countedQty = $data['counted_qty'];

        // Calculate variance
        $varianceQty = $countedQty - $expectedQty;
        $variancePct = $this->calculateVariancePercentage($expectedQty, $countedQty);

        // Check if flagged based on config threshold
        $threshold = (float) Config::get('inventory.variance_alert_threshold_percentage', 5.0);
        $isFlagged = abs($variancePct) > $threshold;

        return CycleCount::create([
            'sku_id' => $data['sku_id'],
            'lot_id' => $data['lot_id'] ?? null,
            'counted_by' => $data['counted_by'],
            'counter_name' => $data['counter_name'],
            'expected_qty' => $expectedQty,
            'counted_qty' => $countedQty,
            'variance_qty' => $varianceQty,
            'variance_pct' => $variancePct,
            'is_flagged' => $isFlagged,
            'status' => 'pending',
            'notes' => $data['notes'] ?? null,
            'counted_at' => now(),
        ]);
    }

    /**
     * Reconcile a cycle count by creating an ADJUSTMENT transaction.
     *
     * @param  array{notes?: string|null}  $data
     */
    public function reconcile(CycleCount $cycleCount, array $data = []): ?string
    {
        if ($cycleCount->status !== 'pending') {
            throw new \RuntimeException('Only pending cycle counts can be reconciled.');
        }

        $user = auth()->user();
        if (! $user || $user->role !== 'admin') {
            throw new \RuntimeException('Only admins can reconcile cycle counts.');
        }

        return DB::transaction(function () use ($cycleCount, $user, $data): string {
            // qty_delta brings the ledger-derived stock in line with the
            // physical count captured at submission time.
            $delta = $cycleCount->counted_qty - $cycleCount->expected_qty;

            // Resolve a lot to attach the append-only ADJUSTMENT to. Fall back
            // to the SKU's first lot when the count was not lot-specific.
            $lotId = $cycleCount->lot_id;
            if ($lotId === null) {
                $lotId = Lot::query()
                    ->where('sku_id', $cycleCount->sku_id)
                    ->value('lot_id');
            }

            if ($lotId === null) {
                throw new \RuntimeException('No lot available to attach the reconciliation adjustment.');
            }

            // InventoryTransactionService::record applies the snapshot side
            // effect under row-level lock and appends the ledger row atomically.
            $txn = (new InventoryTransactionService)->record([
                'lot_id' => $lotId,
                'txn_type' => 'ADJUSTMENT',
                'qty_delta' => $delta,
                'occurred_at' => now(),
            ], $user->id);

            $cycleCount->update([
                'status' => 'reconciled',
                'reconciled_by' => $user->id,
                'reconciled_at' => now(),
                'reconciliation_txn_id' => $txn->txn_id,
                'notes' => $data['notes'] ?? $cycleCount->notes,
            ]);

            return $txn->txn_id;
        }, 5);
    }

    /**
     * Dismiss a cycle count without reconciliation.
     */
    public function dismiss(CycleCount $cycleCount, string $notes): void
    {
        if ($cycleCount->status !== 'pending') {
            throw new \RuntimeException('Only pending cycle counts can be dismissed.');
        }

        $user = auth()->user();
        if (! $user || $user->role !== 'admin') {
            throw new \RuntimeException('Only admins can dismiss cycle counts.');
        }

        $cycleCount->update([
            'status' => 'dismissed',
            'notes' => $notes,
        ]);
    }

    /**
     * Calculate variance percentage.
     */
    private function calculateVariancePercentage(int $expectedQty, int $countedQty): float
    {
        if ($expectedQty === 0) {
            return $countedQty > 0 ? 100.0 : 0.0;
        }

        return round((($countedQty - $expectedQty) / $expectedQty) * 100, 2);
    }
}
