<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sku_id' => $this->sku_id,
            'quantity_ordered' => $this->quantity_ordered,
            'quantity_received' => $this->quantity_received,
            'unit_cost' => $this->unit_cost,
            'total_cost' => $this->total_cost,
            'product' => new ProductResource($this->whenLoaded('product')),
        ];
    }
}
