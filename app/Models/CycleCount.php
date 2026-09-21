<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CycleCount extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'sku_id',
        'lot_id',
        'counted_by',
        'counter_name',
        'expected_qty',
        'counted_qty',
        'variance_qty',
        'variance_pct',
        'is_flagged',
        'status',
        'notes',
        'reconciled_by',
        'reconciled_at',
        'reconciliation_txn_id',
        'counted_at',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'sku_id' => 'string',
            'lot_id' => 'string',
            'counted_by' => 'integer',
            'expected_qty' => 'integer',
            'counted_qty' => 'integer',
            'variance_qty' => 'integer',
            'variance_pct' => 'decimal:2',
            'is_flagged' => 'boolean',
            'counted_at' => 'datetime',
            'reconciled_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'sku_id', 'sku_id');
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class, 'lot_id', 'lot_id');
    }

    public function countedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counted_by');
    }

    public function reconciledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reconciled_by');
    }

    public function reconciliationTransaction()
    {
        return $this->belongsTo(InventoryTransaction::class, 'reconciliation_txn_id', 'txn_id');
    }

    // Scopes

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeReconciled($query)
    {
        return $query->where('status', 'reconciled');
    }

    public function scopeDismissed($query)
    {
        return $query->where('status', 'dismissed');
    }

    public function scopeFlagged($query)
    {
        return $query->where('is_flagged', true);
    }

    public function scopeNotFlagged($query)
    {
        return $query->where('is_flagged', false);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('counted_by', $userId);
    }

    // Mutators

    protected function countedAt(): string
    {
        return $this->attributes['counted_at'];
    }
}
