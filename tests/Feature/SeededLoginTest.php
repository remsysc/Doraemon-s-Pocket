<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeededLoginTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Regression: passwords must not be double-hashed.
     * The User model's "hashed" cast handles hashing automatically,
     * so the seeder must pass plain-text passwords.
     */

    public static function seededAccountsProvider(): array
    {
        return [
            'admin' => ['admin@test.com', 'password', 'admin'],
            'purchasing_manager' => ['purchasing@test.com', 'password', 'purchasing_manager'],
            'warehouse_staff' => ['warehouse@test.com', 'password', 'warehouse_staff'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('seededAccountsProvider')]
    public function test_seeded_account_can_login(string $email, string $password, string $expectedRole): void
    {
        $this->seed();

        $response = $this->postJson('/api/login', [
            'email' => $email,
            'password' => $password,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('email', $email)
            ->assertJsonPath('role', $expectedRole);
    }

    public function test_seeded_account_rejects_wrong_password(): void
    {
        $this->seed();

        $this->postJson('/api/login', [
            'email' => 'admin@test.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable();
    }
}
