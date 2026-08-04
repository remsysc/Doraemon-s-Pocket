<?php

namespace App\Policies;

use App\Models\Lot;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class LotPolicy
{
    public function before(User $user, string $ability): bool|null
    {
        if ($user->role === "admin") {
            return true;
        }
        return null;
    }

    public function viewAny(User $user): bool
    {
        return in_array($user->role, ["purchasing_manager", "warehouse_staff"]);
    }

    public function view(User $user, Lot $lot): bool
    {
        return $this->viewAny($user);
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
    public function update(User $user, Lot $lot): bool
    {
        return $user->role === "purchasing_manager";
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Lot $lot): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Lot $lot): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Lot $lot): bool
    {
        return false;
    }
}
