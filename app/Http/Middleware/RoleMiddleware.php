<?php

namespace App\Http\Middleware;

use Closure;


class RoleMiddleware {

    public  function handle($request, Closure $next, ...$roles){
        $user = $request->user();
        if(!$user){
            abort(401, 'Unauthorized');
        }
        if(!in_array($user->role, $roles)){
            abort(403, 'Forbidden');
        }
        return $next($request);
    }
}
