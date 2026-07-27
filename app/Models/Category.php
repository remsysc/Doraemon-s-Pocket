<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasUlids;
    use SoftDeletes;

    protected $fillable = ["name", "slug"];
    /**
     * @return HasMany<Product,Category>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, "category_id");
    }
}
