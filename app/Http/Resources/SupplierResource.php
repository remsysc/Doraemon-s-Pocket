<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'contact_name' => $this->contact_name,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'address' => $this->address,
            'lead_time_days' => $this->lead_time_days,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
