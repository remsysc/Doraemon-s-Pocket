<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CycleCountResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sku_id' => $this->sku_id,
            'lot_id' => $this->lot_id,
            'product' => $this->whenLoaded('product', new ProductResource($this->product)),
            'lot' => $this->whenLoaded('lot', new LotResource($this->lot)),
            'counted_by' => $this->counted_by,
            'counter_name' => $this->counter_name,
            'expected_qty' => $this->expected_qty,
            'counted_qty' => $this->counted_qty,
            'variance_qty' => $this->variance_qty,
            'variance_pct' => $this->variance_pct,
            'is_flagged' => $this->is_flagged,
            'status' => $this->status,
            'notes' => $this->notes,
            'reconciled_by' => $this->reconciled_by,
            'reconciled_at' => $this->reconciled_at?->toIso8601String(),
            'reconciliation_txn_id' => $this->reconciliation_txn_id,
            'counted_at' => $this->counted_at->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
