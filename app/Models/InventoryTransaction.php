<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryTransaction extends Model
{
    use HasUuids;

    public const TYPES = [
        "RECEIPT",
        "RESERVE",
        "PICK",
        "SALE",
        "ADJUSTMENT",
        "WRITE_OFF",
    ];

    protected $primaryKey = "txn_id";

    protected $fillable = [
        "lot_id",
        "actor_id",
        "txn_type",
        "qty_delta",
        "occurred_at",
    ];

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class, "lot_id", "lot_id");
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, "actor_id");
    }
}
