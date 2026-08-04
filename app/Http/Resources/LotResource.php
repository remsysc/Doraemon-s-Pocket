<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LotResource extends JsonResource
{
    public function toArray(Request $request)
    {
        return [
            "sku_id" => $this->sku_id,
            "received_date" => $this->received_date,
            "expiry_date" => $this->expiry_date,
            "bin_location" => $this->bin_location,
        ];
    }
}
