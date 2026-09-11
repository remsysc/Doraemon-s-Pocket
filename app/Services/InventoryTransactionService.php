<?php

namespace App\Services;

use App\Exceptions\InventoryTransactionException;
use App\Models\InventorySnapshot;
use App\Models\InventoryTransaction;
use App\Models\Lot;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class InventoryTransactionService
{
    /**
     * Apply the stock side effect and append the ledger row atomically.
     *
     * @param  array{lot_id: string, txn_type: string, qty_delta: int, occurred_at: mixed}  $attributes
     */
    public function record(array $attributes, int $actorId): InventoryTransaction
    {
        return DB::transaction(function () use ($attributes, $actorId): InventoryTransaction {
            $lot = Lot::query()->findOrFail($attributes['lot_id']);

            // Lock the Product before first snapshot creation. This serializes
            // initialization when concurrent transactions target a new SKU.
            $product = Product::query()
                ->whereKey($lot->sku_id)
                ->lockForUpdate()
                ->firstOrFail();

            $snapshot = InventorySnapshot::query()
                ->where('sku_id', $product->sku_id)
                ->lockForUpdate()
                ->first();

            if ($snapshot === null) {
                InventorySnapshot::create([
                    'sku_id' => $product->sku_id,
                ]);

                // Explicitly acquire the snapshot row lock after creating it.
                $snapshot = InventorySnapshot::query()
                    ->where('sku_id', $product->sku_id)
                    ->lockForUpdate()
                    ->firstOrFail();
            }

            $this->applySideEffect(
                $snapshot,
                $attributes['txn_type'],
                (int) $attributes['qty_delta'],
            );

            $snapshot->save();

            return InventoryTransaction::create([
                ...$attributes,
                'actor_id' => $actorId,
            ]);
        }, 5);
    }

    private function applySideEffect(
        InventorySnapshot $snapshot,
        string $transactionType,
        int $quantityDelta,
    ): void {
        [$onHand, $reserved, $available] = self::project(
            $snapshot->qty_on_hand,
            $snapshot->qty_reserved,
            $snapshot->qty_available,
            $transactionType,
            $quantityDelta,
        );

        $snapshot->qty_on_hand = $onHand;
        $snapshot->qty_reserved = $reserved;
        $snapshot->qty_available = $available;
    }

    /**
     * Pure projection of a single signed ledger delta onto a snapshot's
     * quantity triple. This is the single source of truth for snapshot
     * semantics (SPEC FR-22/FR-23) shared by the live transaction path and
     * by ledger-replay callers such as the demo seeder. It performs no I/O
     * and throws {@see InventoryTransactionException} on any sign, sufficiency,
     * or invariant violation.
     *
     * @return array{0: int, 1: int, 2: int} The resulting [onHand, reserved, available].
     */
    public static function project(
        int $onHand,
        int $reserved,
        int $available,
        string $transactionType,
        int $quantityDelta,
    ): array {
        switch ($transactionType) {
            case 'RECEIPT':
                self::requirePositiveQuantity($transactionType, $quantityDelta);
                $onHand += $quantityDelta;
                $available += $quantityDelta;
                break;

            case 'ADJUSTMENT':
                $onHand += $quantityDelta;
                $available += $quantityDelta;
                break;

            case 'RESERVE':
                if ($quantityDelta < 0) {
                    $amount = abs($quantityDelta);
                    self::requireAvailableStock($available, $amount);
                    $reserved += $amount;
                    $available -= $amount;
                } else {
                    self::requireReservedStock($reserved, $quantityDelta);
                    $reserved -= $quantityDelta;
                    $available += $quantityDelta;
                }
                break;

            case 'PICK':
                self::requireNegativeQuantity($transactionType, $quantityDelta);
                $amount = abs($quantityDelta);
                self::requireReservedStock($reserved, $amount);
                $onHand -= $amount;
                $reserved -= $amount;
                break;

            case 'SALE':
            case 'WRITE_OFF':
                self::requireNegativeQuantity($transactionType, $quantityDelta);
                $amount = abs($quantityDelta);
                self::requireAvailableStock($available, $amount);
                $onHand -= $amount;
                $available -= $amount;
                break;

            default:
                throw new InventoryTransactionException(
                    'INVALID_TRANSACTION_TYPE',
                    'The transaction type does not have a stock operation.',
                );
        }

        if (
            $onHand < 0
            || $reserved < 0
            || $available < 0
            || $available !== $onHand - $reserved
        ) {
            throw new InventoryTransactionException(
                'INSUFFICIENT_STOCK',
                'The transaction would violate the available stock balance.',
            );
        }

        return [$onHand, $reserved, $available];
    }

    private static function requirePositiveQuantity(string $transactionType, int $quantityDelta): void
    {
        if ($quantityDelta <= 0) {
            throw new InventoryTransactionException(
                'INVALID_QTY_DELTA',
                "$transactionType transactions require a positive qty_delta.",
            );
        }
    }

    private static function requireNegativeQuantity(string $transactionType, int $quantityDelta): void
    {
        if ($quantityDelta >= 0) {
            throw new InventoryTransactionException(
                'INVALID_QTY_DELTA',
                "$transactionType transactions require a negative qty_delta.",
            );
        }
    }

    private static function requireAvailableStock(int $available, int $amount): void
    {
        if ($available < $amount) {
            throw new InventoryTransactionException(
                'INSUFFICIENT_STOCK',
                'Insufficient available stock for this transaction.',
            );
        }
    }

    private static function requireReservedStock(int $reserved, int $amount): void
    {
        if ($reserved < $amount) {
            throw new InventoryTransactionException(
                'INSUFFICIENT_RESERVED_STOCK',
                'Insufficient reserved stock for this transaction.',
            );
        }
    }
}
