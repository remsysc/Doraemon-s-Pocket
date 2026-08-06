<?php
use App\Http\Resources\LotResource;
use App\Http\Resources\UserResource;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryTransactionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            "id" => $this->txn_id,
            "type" => $this->txn_type,
            "quantity_delta" => $this->quantity_delta,
            "occured_at" => $this->occured_at,
            "created_at" => $this->created_at,
            "lot" => new LotResource($this->whenLoaded("lot")),
            "actor" => new UserResource($this->whenLoaded("actor")),
        ];
    }
}
