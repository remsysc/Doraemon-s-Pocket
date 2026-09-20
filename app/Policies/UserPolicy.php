<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine if the user can view any users.
     */
    public function viewAny(?User $user): bool
    {
        return $user !== null && $user->role === 'admin';
    }

    /**
     * Determine if the user can view the model.
     */
    public function view(?User $user, User $model): bool
    {
        return $user !== null && $user->role === 'admin';
    }

    /**
     * Determine if the user can create models.
     */
    public function create(?User $user): bool
    {
        return $user !== null && $user->role === 'admin';
    }

    /**
     * Determine if the user can update the model.
     */
    public function update(?User $user, User $model): bool
    {
        return $user !== null && $user->role === 'admin';
    }

    /**
     * Determine if the user can delete the model.
     */
    public function delete(?User $user, User $model): bool
    {
        return $user !== null && $user->role === 'admin';
    }

    /**
     * Determine if the user can deactivate the model.
     */
    public function deactivate(?User $user, User $model): bool
    {
        return $user !== null && $user->role === 'admin';
    }
}
