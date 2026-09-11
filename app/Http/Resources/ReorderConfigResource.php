<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReorderConfigResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'sku_id' => $this->sku_id,
            'reorder_point' => $this->reorder_point,
            'safety_stock' => $this->safety_stock,
            'lead_time_days' => $this->lead_time_days,
            'order_cost' => $this->order_cost,
            'holding_cost_per_unit' => $this->holding_cost_per_unit,
            'service_level_z' => $this->service_level_z,
            'product' => new ProductResource($this->whenLoaded('product')),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
