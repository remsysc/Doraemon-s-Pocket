<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $primaryKey = "category_id";
    protected $fillable = ["name", "slug", "description"];
    /**
     * @return HasMany<Product,Category>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, "category_id");
    }
}
