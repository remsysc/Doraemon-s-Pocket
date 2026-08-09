<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_with_a_supported_role(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New Warehouse Staff',
            'email' => 'new.staff@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'warehouse_staff',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email', 'role'],
            ])
            ->assertJsonPath('user.email', 'new.staff@example.com')
            ->assertJsonPath('user.role', 'warehouse_staff');

        $this->assertDatabaseHas('users', [
            'email' => 'new.staff@example.com',
            'role' => 'warehouse_staff',
        ]);
    }

    public function test_registration_rejects_an_unsupported_role(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Invalid Role User',
            'email' => 'invalid.role@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'supervisor',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['role']);

        $this->assertDatabaseMissing('users', [
            'email' => 'invalid.role@example.com',
        ]);
    }

    public function test_registration_rejects_a_duplicate_email(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $this->postJson('/api/register', [
            'name' => 'Duplicate User',
            'email' => 'existing@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'admin',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }
}
