<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            "id" => $this->sku_id,
            "name" => $this->name,
            "description" => $this->description,
            "barcode" => $this->barcode,
            "unit_of_measure" => $this->unit_of_measure,
            "category" => new CategoryResource($this->category),
            "metadata" => [
                "is_seasonal" => $this->is_seasonal,
                "shelf_life_days" => $this->shelf_life_days,
            ],
            "status" => $this->is_active ? "active" : "inactive",
            "created_at" => $this->created_at?->toISOString(),
            "updated_at" => $this->updated_at?->toISOString(),
        ];
    }
}
