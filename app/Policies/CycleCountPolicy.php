<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\CycleCount;
use App\Models\User;

class CycleCountPolicy
{
    /**
     * Determine if the user can view any cycle counts.
     */
    public function viewAny(?User $user): bool
    {
        return $user !== null;
    }

    /**
     * Determine if the user can view the cycle count.
     */
    public function view(?User $user, CycleCount $cycleCount): bool
    {
        // Admin can view all; WS can view their own counts
        return $user !== null && ($user->role === 'admin' || $cycleCount->counted_by === $user->id);
    }

    /**
     * Determine if the user can create cycle counts.
     */
    public function create(?User $user): bool
    {
        // WS and Admin can create; PM gets 403
        return $user !== null && in_array($user->role, ['admin', 'warehouse_staff']);
    }

    /**
     * Determine if the user can update the cycle count.
     */
    public function update(?User $user, CycleCount $cycleCount): bool
    {
        // Only Admin can update (for reconciliation/dismissal)
        return $user !== null && $user->role === 'admin';
    }

    /**
     * Determine if the user can delete the cycle count.
     */
    public function delete(?User $user, CycleCount $cycleCount): bool
    {
        return false;
    }
}
