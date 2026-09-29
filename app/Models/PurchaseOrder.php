<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    use HasFactory, HasUuids;

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * Valid status transitions: draft → ordered → received.
     * A PO can only move forward, never backwards.
     */
    public const VALID_TRANSITIONS = [
        'draft' => ['ordered'],
        'ordered' => ['received'],
        'received' => [],
    ];

    protected $fillable = [
        'po_number',
        'supplier_id',
        'status',
        'order_date',
        'expected_delivery_date',
        'notes',
        'total_amount',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'order_date' => 'date',
            'expected_delivery_date' => 'date',
            'total_amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Supplier, PurchaseOrder>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }

    /**
     * @return BelongsTo<User, PurchaseOrder>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    /**
     * @return HasMany<PurchaseOrderItem, PurchaseOrder>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class, 'po_id', 'id');
    }

    public function isFullyReceived(): bool
    {
        return $this->items()->whereColumn('quantity_received', '<', 'quantity_ordered')->doesntExist();
    }
}
