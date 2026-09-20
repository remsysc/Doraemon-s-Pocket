<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * The API health check responds successfully.
     *
     * The root route ("/") serves the React SPA and requires a built Vite
     * manifest, which is produced by the separate frontend-build CI job. This
     * backend test instead asserts the JSON API is reachable and enforces
     * authentication, which does not depend on compiled front-end assets.
     */
    public function test_the_api_requires_authentication(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertUnauthorized();
    }
}
