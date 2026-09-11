<?php

namespace App\Policies;

use App\Models\ReorderConfig;
use App\Models\User;

class ReorderConfigPolicy
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
     * Reorder configuration is purchasing-owned: Purchasing Manager + Admin.
     * Warehouse Staff has no access at all (SPEC FR-32, PRD §4).
     */
    public function viewAny(User $user): bool
    {
        return $user->role === 'purchasing_manager';
    }

    public function view(User $user, ReorderConfig $reorderConfig): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, ReorderConfig $reorderConfig): bool
    {
        return $this->viewAny($user);
    }

    public function delete(User $user, ReorderConfig $reorderConfig): bool
    {
        return $this->viewAny($user);
    }
}
