<?php

namespace Tests\Feature;

use App\Http\Middleware\RoleMiddleware;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Tests\TestCase;

/**
 * Covers the Admin-superuser rule from the 2026-08-04 RBAC refinement
 * (PRD §4/§9, SPEC §2 RBAC subsection): Admin passes every `role:` check
 * regardless of which roles a route lists, so it never has to be re-added
 * to every route group by hand.
 */
class RoleMiddlewareTest extends TestCase
{
    private function requestAs(?User $user): Request
    {
        $request = Request::create("/test");
        $request->setUserResolver(fn() => $user);
        return $request;
    }

    public function test_admin_bypasses_role_check_even_when_not_listed(): void
    {
        $admin = User::factory()->admin()->make();
        $middleware = new RoleMiddleware();
        $called = false;

        $response = $middleware->handle(
            $this->requestAs($admin),
            function ($request) use (&$called) {
                $called = true;
                return "next-called";
            },
            "purchasing_manager", // admin is deliberately NOT in this list
        );

        $this->assertTrue(
            $called,
            "Expected the request to proceed past the middleware for an admin.",
        );
        $this->assertSame("next-called", $response);
    }

    public function test_non_admin_role_outside_list_is_forbidden(): void
    {
        $warehouseStaff = User::factory()->warehouseStaff()->make();
        $middleware = new RoleMiddleware();

        try {
            $middleware->handle(
                $this->requestAs($warehouseStaff),
                fn($request) => "next-called",
                "purchasing_manager",
            );
            $this->fail("Expected a 403 HttpException to be thrown.");
        } catch (HttpExceptionInterface $e) {
            $this->assertSame(403, $e->getStatusCode());
        }
    }

    public function test_non_admin_role_inside_list_is_allowed(): void
    {
        $purchasingManager = User::factory()->purchasingManager()->make();
        $middleware = new RoleMiddleware();

        $response = $middleware->handle(
            $this->requestAs($purchasingManager),
            fn($request) => "next-called",
            "purchasing_manager",
        );

        $this->assertSame("next-called", $response);
    }

    public function test_guest_is_unauthorized(): void
    {
        $middleware = new RoleMiddleware();

        try {
            $middleware->handle(
                $this->requestAs(null),
                fn($request) => "next-called",
                "admin",
            );
            $this->fail("Expected a 401 HttpException to be thrown.");
        } catch (HttpExceptionInterface $e) {
            $this->assertSame(401, $e->getStatusCode());
        }
    }
}
