<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            "id" => $this->audit_id,
            "actor" => new UserResource($this->whenLoaded("actor")),
            "action" => $this->action,
            "entity_type" => $this->entity_type,
            "entity_id" => $this->entity_id,
            "old_values" => $this->old_values,
            "new_values" => $this->new_values,
            "occurred_at" => $this->occurred_at,
        ];
    }
}
