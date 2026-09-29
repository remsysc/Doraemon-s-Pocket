<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Supplier;
use App\Models\User;

class SupplierPolicy
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
     * All authenticated roles can read Suppliers (Warehouse Staff needs them for PO context).
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Supplier $supplier): bool
    {
        return true;
    }

    /**
     * Supplier writes: Purchasing Manager + Admin (superuser).
     */
    public function create(User $user): bool
    {
        return $user->role === 'purchasing_manager';
    }

    public function update(User $user, Supplier $supplier): bool
    {
        return $user->role === 'purchasing_manager';
    }

    public function delete(User $user, Supplier $supplier): bool
    {
        return $user->role === 'purchasing_manager';
    }
}
