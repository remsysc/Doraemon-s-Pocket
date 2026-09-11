<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReorderConfig extends Model
{
    protected $primaryKey = 'sku_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $attributes = [
        'lead_time_days' => 0,
        'service_level_z' => 1.65,
    ];

    protected $fillable = [
        'sku_id',
        'reorder_point',
        'safety_stock',
        'lead_time_days',
        'order_cost',
        'holding_cost_per_unit',
        'service_level_z',
    ];

    protected function casts(): array
    {
        return [
            'reorder_point' => 'integer',
            'safety_stock' => 'integer',
            'lead_time_days' => 'integer',
            'order_cost' => 'decimal:2',
            'holding_cost_per_unit' => 'decimal:2',
            'service_level_z' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'sku_id', 'sku_id');
    }
}
