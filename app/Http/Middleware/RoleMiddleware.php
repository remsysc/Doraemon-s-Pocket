<?php

namespace App\Http\Middleware;

use Closure;

class RoleMiddleware
{
    /**
     * @param mixed $request
     * @param Closure(): void $next
     * @param mixed $roles
     */
    public function handle($request, Closure $next, ...$roles)
    {
        $user = $request->user();
        if (!$user) {
            abort(401, "Unauthorized");
        }
        // Admin is a superuser: it always passes every role check, regardless
        // of which roles a given route lists. This keeps "admin" from having
        // to be re-added to every route group by hand, and matches the PRD/SPEC
        // RBAC rule that Admin has backend access to everything; only the
        // frontend's nav/default-dashboard choice steers Admin away from the
        // day-to-day picking/reorder-config screens, not this middleware.
        if ($user->role === "admin") {
            return $next($request);
        }
        if (!in_array($user->role, $roles)) {
            abort(403, "Forbidden");
        }
        return $next($request);
    }
}
