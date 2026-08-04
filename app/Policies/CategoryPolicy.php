<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CategoryPolicy
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
    public function view(User $user, Category $category): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Determine whether the user can create models.
     *
     * Category is catalog/master data, Admin-governed only as of the
     * 2026-08-04 RBAC refinement (PRD §4/§6, SPEC FR-7) — Purchasing
     * Manager no longer writes it. Admin is granted via before().
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Category $category): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Category $category): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Category $category): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Category $category): bool
    {
        return false;
    }
}
