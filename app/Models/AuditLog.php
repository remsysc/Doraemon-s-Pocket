<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    /** @use HasFactory<\Database\Factories\AuditLogFactory> */
    use HasFactory;
    use HasUuids;

    protected $primaryKey = "audit_id";
    public $incrementing = false;
    protected $keyType = "string";
    public $timestamps = false;
    protected $fillable = [
        "actor_id",
        "action",
        "entity_id",
        "entity_type",
        "old_values",
        "new_values",
        "occurred_at",
    ];

    protected function casts(): array
    {
        return [
            "old_values" => "array",
            "new_values" => "array",
            "occurred_at" => "datetime",
        ];
    }

    public function actor()
    {
        return $this->belongsTo(User::class, "actor_id");
    }
}
