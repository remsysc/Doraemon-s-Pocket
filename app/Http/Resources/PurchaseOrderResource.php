<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'po_number' => $this->po_number,
            'supplier_id' => $this->supplier_id,
            'status' => $this->status,
            'order_date' => $this->order_date?->toDateString(),
            'expected_delivery_date' => $this->expected_delivery_date?->toDateString(),
            'notes' => $this->notes,
            'total_amount' => $this->total_amount,
            'created_by' => $this->created_by,
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'items' => PurchaseOrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
