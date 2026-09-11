<?php

namespace App\Policies;

use App\Models\InventorySnapshot;
use App\Models\User;

class InventorySnapshotPolicy
{
    /**
     * Admin is a backend superuser and bypasses the specific checks below.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role === "admin") {
            return true;
        }

        return null;
    }

    /**
     * All authenticated roles can read derived stock snapshots (SPEC FR-22, §4).
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ["purchasing_manager", "warehouse_staff"], true);
    }

    public function view(User $user, InventorySnapshot $inventorySnapshot): bool
    {
        return $this->viewAny($user);
    }
}
