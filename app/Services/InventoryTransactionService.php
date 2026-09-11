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
     * @param array{lot_id: string, txn_type: string, qty_delta: int, occurred_at: mixed} $attributes
     */
    public function record(array $attributes, int $actorId): InventoryTransaction
    {
        return DB::transaction(function () use ($attributes, $actorId): InventoryTransaction {
            $lot = Lot::query()->findOrFail($attributes["lot_id"]);

            // Lock the Product before first snapshot creation. This serializes
            // initialization when concurrent transactions target a new SKU.
            $product = Product::query()
                ->whereKey($lot->sku_id)
                ->lockForUpdate()
                ->firstOrFail();

            $snapshot = InventorySnapshot::query()
                ->where("sku_id", $product->sku_id)
                ->lockForUpdate()
                ->first();

            if ($snapshot === null) {
                InventorySnapshot::create([
                    "sku_id" => $product->sku_id,
                ]);

                // Explicitly acquire the snapshot row lock after creating it.
                $snapshot = InventorySnapshot::query()
                    ->where("sku_id", $product->sku_id)
                    ->lockForUpdate()
                    ->firstOrFail();
            }

            $this->applySideEffect(
                $snapshot,
                $attributes["txn_type"],
                (int) $attributes["qty_delta"],
            );

            $snapshot->save();

            return InventoryTransaction::create([
                ...$attributes,
                "actor_id" => $actorId,
            ]);
        }, 5);
    }

    private function applySideEffect(
        InventorySnapshot $snapshot,
        string $transactionType,
        int $quantityDelta,
    ): void {
        switch ($transactionType) {
            case "RECEIPT":
                $this->requirePositiveQuantity($transactionType, $quantityDelta);
                $snapshot->qty_on_hand += $quantityDelta;
                $snapshot->qty_available += $quantityDelta;
                break;

            case "ADJUSTMENT":
                $snapshot->qty_on_hand += $quantityDelta;
                $snapshot->qty_available += $quantityDelta;
                break;

            case "RESERVE":
                if ($quantityDelta < 0) {
                    $amount = abs($quantityDelta);
                    $this->requireAvailableStock($snapshot, $amount);
                    $snapshot->qty_reserved += $amount;
                    $snapshot->qty_available -= $amount;
                } else {
                    $this->requireReservedStock($snapshot, $quantityDelta);
                    $snapshot->qty_reserved -= $quantityDelta;
                    $snapshot->qty_available += $quantityDelta;
                }
                break;

            case "PICK":
                $this->requireNegativeQuantity($transactionType, $quantityDelta);
                $amount = abs($quantityDelta);
                $this->requireReservedStock($snapshot, $amount);
                $snapshot->qty_on_hand -= $amount;
                $snapshot->qty_reserved -= $amount;
                break;

            case "SALE":
            case "WRITE_OFF":
                $this->requireNegativeQuantity($transactionType, $quantityDelta);
                $amount = abs($quantityDelta);
                $this->requireAvailableStock($snapshot, $amount);
                $snapshot->qty_on_hand -= $amount;
                $snapshot->qty_available -= $amount;
                break;

            default:
                throw new InventoryTransactionException(
                    "INVALID_TRANSACTION_TYPE",
                    "The transaction type does not have a stock operation.",
                );
        }

        if (
            $snapshot->qty_on_hand < 0
            || $snapshot->qty_reserved < 0
            || $snapshot->qty_available < 0
            || $snapshot->qty_available !== $snapshot->qty_on_hand - $snapshot->qty_reserved
        ) {
            throw new InventoryTransactionException(
                "INSUFFICIENT_STOCK",
                "The transaction would violate the available stock balance.",
            );
        }
    }

    private function requirePositiveQuantity(string $transactionType, int $quantityDelta): void
    {
        if ($quantityDelta <= 0) {
            throw new InventoryTransactionException(
                "INVALID_QTY_DELTA",
                "$transactionType transactions require a positive qty_delta.",
            );
        }
    }

    private function requireNegativeQuantity(string $transactionType, int $quantityDelta): void
    {
        if ($quantityDelta >= 0) {
            throw new InventoryTransactionException(
                "INVALID_QTY_DELTA",
                "$transactionType transactions require a negative qty_delta.",
            );
        }
    }

    private function requireAvailableStock(InventorySnapshot $snapshot, int $amount): void
    {
        if ($snapshot->qty_available < $amount) {
            throw new InventoryTransactionException(
                "INSUFFICIENT_STOCK",
                "Insufficient available stock for this transaction.",
            );
        }
    }

    private function requireReservedStock(InventorySnapshot $snapshot, int $amount): void
    {
        if ($snapshot->qty_reserved < $amount) {
            throw new InventoryTransactionException(
                "INSUFFICIENT_RESERVED_STOCK",
                "Insufficient reserved stock for this transaction.",
            );
        }
    }
}
