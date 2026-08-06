<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    use HasUuids;
    protected $primaryKey = "txn_id";

    protected $fillable = [
        "lot_id",
        "user_id",
        "txn_type",
        "qty_delta",
        "occured_at",
    ];

    public function lot()
    {
        return $this->belongsTo(Lot::class, "lot_id");
    }

    public function user()
    {
        return $this->belongsTo(User::class, "actor_id");
    }
}
