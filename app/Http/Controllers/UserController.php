<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\AuditLog;
use App\Models\CycleCount;
use App\Models\InventoryTransaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->query('active'), fn ($q, $value) => $q->where('is_active', filter_var($value, FILTER_VALIDATE_BOOL)))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json(UserResource::collection($users)->response()->getData(true));
    }

    /**
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(new UserResource($user), JsonResponse::HTTP_CREATED);
    }

    /**
     * Display the specified user.
     */
    public function show(Request $request, User $user): JsonResponse
    {
        return response()->json(new UserResource($user));
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        // Admin cannot modify their own role or deactivate themselves
        $currentUser = $request->user();
        if ($currentUser->id === $user->id) {
            // Allow updating own profile (name, email, password)
            // But prevent deactivation or role change of self
            $validated = $request->validated();
            if (isset($validated['is_active']) && ! $validated['is_active']) {
                abort(403, 'You cannot deactivate your own account.');
            }
            if (isset($validated['role']) && $validated['role'] !== $user->role) {
                abort(403, 'You cannot change your own role.');
            }
        }

        $data = $request->validated();

        $updateData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'is_active' => $data['is_active'] ?? $user->is_active,
        ];

        if (! empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        return response()->json(new UserResource($user));
    }

    /**
     * Remove the specified user from storage.
     *
     * Hard deletion is blocked when the user has historical records
     * (inventory transactions, cycle counts, or audit logs) to preserve
     * referential integrity and traceability. Admins should deactivate
     * such accounts instead.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        // Admin cannot delete their own account
        $currentUser = $request->user();
        if ($currentUser->id === $user->id) {
            abort(403, 'You cannot delete your own account.');
        }

        if ($this->hasHistory($user)) {
            abort(
                JsonResponse::HTTP_CONFLICT,
                'This user has historical records and cannot be deleted. Deactivate the account instead.',
            );
        }

        $user->delete();

        return response()->json(null, JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Whether the user is referenced by append-only history that must be
     * preserved (ledger, cycle counts, or audit logs).
     */
    private function hasHistory(User $user): bool
    {
        $hasTransactions = InventoryTransaction::query()
            ->where('actor_id', $user->id)
            ->exists();

        $hasCycleCounts = CycleCount::query()
            ->where('counted_by', $user->id)
            ->orWhere('reconciled_by', $user->id)
            ->exists();

        $hasAuditLogs = AuditLog::query()
            ->where('actor_id', $user->id)
            ->exists();

        return $hasTransactions || $hasCycleCounts || $hasAuditLogs;
    }

    /**
     * Deactivate the specified user.
     */
    public function deactivate(Request $request, User $user): JsonResponse
    {
        // Admin cannot deactivate their own account
        $currentUser = $request->user();
        if ($currentUser->id === $user->id) {
            abort(403, 'You cannot deactivate your own account.');
        }

        $user->update(['is_active' => false]);

        return response()->json(new UserResource($user));
    }
}
