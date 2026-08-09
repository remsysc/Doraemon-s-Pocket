<?php

namespace App\Models;

use App\Models\Category;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasUuids;

    protected $primaryKey = "sku_id";

    protected $fillable = [
        "name",
        "description",
        "barcode",
        "unit_of_measure",
        "is_seasonal",
        "shelf_life_days",
        "is_active",
        "category_id",
    ];
    /**
     * @return BelongsTo<Category,Product>
     */
    public function category(): BelongsTo
    {
        // Preserve historical Product → Category relationships after a soft delete.
        return $this->belongsTo(Category::class, "category_id")->withTrashed();
    }
}
