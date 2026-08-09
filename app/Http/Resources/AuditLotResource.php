<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            "audit_id" => $this->audit_id,
            "actor_id" => $this->actor_id,
            "action" => $this->action,
            "entity_id" => $this->entity_id,
            "entity_type" => $this->entity_type,
            "old_value" => $this->old_value,
            "new_value" => $this->new_value,
            "occurred_at" => $this->occurred_at?->toISOString(),
        ];
    }
}
