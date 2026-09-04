<?php

use App\Exceptions\InventoryTransactionException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => App\Http\Middleware\RoleMiddleware::class,
        ]);
        
        $middleware->statefulApi();

        $middleware->appendToGroup('api', [
            \Illuminate\Session\Middleware\StartSession::class,
        ]);

        // Trust Railway's (and other PaaS) reverse proxies for HTTPS termination.
        // TRUSTED_PROXIES=* tells Laravel to trust all proxies (safe behind Railway's LB).
        $middleware->trustProxies(
            at: env('TRUSTED_PROXIES', null) === '*' ? '*' : [],
            headers: Request::HEADER_X_FORWARDED_FOR |
                     Request::HEADER_X_FORWARDED_HOST |
                     Request::HEADER_X_FORWARDED_PORT |
                     Request::HEADER_X_FORWARDED_PROTO,
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (InventoryTransactionException $exception, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'code' => $exception->errorCode,
                ], 422);
            }

            return null;
        });
    })->create();
