<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\PurchaseOrder;
use App\Models\User;

class PurchaseOrderPolicy
{
    /**
     * Admin is a backend superuser and bypasses the specific checks below.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return null;
    }

    /**
     * All authenticated roles can list/view Purchase Orders.
     * Warehouse Staff needs read access to receive against POs (FR-41).
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return true;
    }

    /**
     * Only Purchasing Manager (+ Admin superuser) can create/update/delete POs.
     */
    public function create(User $user): bool
    {
        return $user->role === 'purchasing_manager';
    }

    public function update(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return $user->role === 'purchasing_manager';
    }

    public function delete(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return $user->role === 'purchasing_manager';
    }

    /**
     * Warehouse Staff + Admin can receive against a PO (FR-41).
     */
    public function receive(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return $user->role === 'warehouse_staff';
    }
}
