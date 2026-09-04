<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventorySnapshot extends Model
{
    protected $primaryKey = "sku_id";

    public $incrementing = false;

    protected $keyType = "string";

    protected $attributes = [
        "qty_on_hand" => 0,
        "qty_reserved" => 0,
        "qty_available" => 0,
    ];

    protected $fillable = [
        "sku_id",
        "qty_on_hand",
        "qty_reserved",
        "qty_available",
    ];

    protected function casts(): array
    {
        return [
            "qty_on_hand" => "integer",
            "qty_reserved" => "integer",
            "qty_available" => "integer",
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, "sku_id", "sku_id");
    }
}
