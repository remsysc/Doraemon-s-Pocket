<?php

namespace App\Models;

use App\Models\Product;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lot extends Model
{
    use HasUuids;

    protected $primaryKey = "lot_id"; //we use this because we dont use the default "id" on  the migration

    protected $fillable = [
        "sku_id",
        "received_date",
        "expiry_date",
        "bin_location",
    ];
    /**
     * @return BelongsTo<Product,Lot>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, "sku_id", "sku_id");
    }
}
