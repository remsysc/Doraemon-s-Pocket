<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
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
    public function view(User $user, Product $product): bool
    {
        return in_array($user->role, ["purchasing_manager", "warehouse_staff"]);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->role === "purchasing_manager";
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Product $product): bool
    {
        return $user->role === "purchasing_manager";
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Product $product): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Product $product): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Product $product): bool
    {
        return false;
    }
}
