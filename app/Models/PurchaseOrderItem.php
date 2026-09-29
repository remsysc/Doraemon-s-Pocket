<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    use HasFactory, HasUuids;

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'po_id',
        'sku_id',
        'quantity_ordered',
        'quantity_received',
        'unit_cost',
        'total_cost',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity_ordered' => 'integer',
            'quantity_received' => 'integer',
            'unit_cost' => 'decimal:2',
            'total_cost' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<PurchaseOrder, PurchaseOrderItem>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id', 'id');
    }

    /**
     * @return BelongsTo<Product, PurchaseOrderItem>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'sku_id', 'sku_id');
    }
}
