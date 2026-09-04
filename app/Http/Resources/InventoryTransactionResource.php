<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class InventoryTransactionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->txn_id,
            'type'           => $this->txn_type,
            'quantity_delta' => $this->qty_delta,
            'occurred_at'     => $this->occurred_at,
            'created_at'     => $this->created_at,
            'lot'            => new LotResource($this->whenLoaded('lot')),
            'actor'          => new UserResource($this->whenLoaded('actor')),
        ];
    }
}
