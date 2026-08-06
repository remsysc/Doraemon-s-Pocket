<?php

namespace App\Policies;

use App\Models\InventoryTransaction;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class InventoryTransactionPolicy
{
    /*
    INTERCEPTS FOR ADMINS
    If this method return true, the admin is automatically granted access
    and Laravel skips checking the other methods below
    */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role === "admin") {
            return true;
        }
        return null;
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ["purchasing_manager", "warehouse_staff"]);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        InventoryTransaction $inventoryTransaction,
    ): bool {
        return $this->viewAny($user);
    }

    /**
     * Determine whether the user can create models.
     *
     * InventoryTransaction is catalog/master data, Admin-governed only as of the
     * 2026-08-04 RBAC refinement (PRD §4/§6, SPEC FR-11) — Purchasing
     * Manager no longer writes it. Admin is granted via before().
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        InventoryTransaction $inventoryTransaction,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        InventoryTransaction $inventoryTransaction,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(
        User $user,
        InventoryTransaction $inventoryTransaction,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        InventoryTransaction $inventoryTransaction,
    ): bool {
        return false;
    }
}
