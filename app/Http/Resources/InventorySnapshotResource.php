<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventorySnapshotResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            "sku_id" => $this->sku_id,
            "qty_on_hand" => $this->qty_on_hand,
            "qty_reserved" => $this->qty_reserved,
            "qty_available" => $this->qty_available,
            "product" => new ProductResource($this->whenLoaded("product")),
            "updated_at" => $this->updated_at?->toISOString(),
        ];
    }
}
