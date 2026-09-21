<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_admin_can_list_users(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->getJson('/api/users');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data'); // 3 seeded users
        $emails = collect($response->json('data'))->pluck('email');
        $this->assertContains('admin@test.com', $emails->all());
        $this->assertContains('purchasing@test.com', $emails->all());
        $this->assertContains('warehouse@test.com', $emails->all());
    }

    public function test_purchasing_manager_cannot_list_users(): void
    {
        $pm = User::where('email', 'purchasing@test.com')->first();
        $this->actingAs($pm);

        $response = $this->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_guest_cannot_list_users(): void
    {
        $response = $this->getJson('/api/users');

        $response->assertStatus(401);
    }

    public function test_admin_can_create_user(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'new@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'warehouse_staff',
            'is_active' => true,
        ]);

        $response->assertStatus(201);
        $this->assertEquals('new@test.com', $response->json('email'));
        $this->assertEquals('warehouse_staff', $response->json('role'));
        $this->assertTrue($response->json('is_active'));

        // Verify password is hashed
        $user = User::where('email', 'new@test.com')->first();
        $this->assertTrue(Hash::check('password123', $user->password));
    }

    public function test_admin_cannot_create_duplicate_email(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->postJson('/api/users', [
            'name' => 'Duplicate User',
            'email' => 'admin@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'warehouse_staff',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }

    public function test_admin_can_update_user(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $warehouseUser = User::where('email', 'warehouse@test.com')->first();
        $this->actingAs($admin);

        $response = $this->putJson("/api/users/{$warehouseUser->id}", [
            'name' => 'Updated Warehouse User',
            'email' => 'warehouse@test.com',
            'role' => 'purchasing_manager',
            'is_active' => false,
        ]);

        $response->assertStatus(200);
        $this->assertEquals('Updated Warehouse User', $response->json('name'));
        $this->assertEquals('purchasing_manager', $response->json('role'));
        $this->assertFalse($response->json('is_active'));
    }

    public function test_admin_cannot_update_own_role(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->putJson("/api/users/{$admin->id}", [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => 'warehouse_staff',
            'is_active' => true,
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'You cannot change your own role.');
    }

    public function test_admin_cannot_deactivate_self(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->postJson("/api/users/{$admin->id}/deactivate");

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'You cannot deactivate your own account.');
    }

    public function test_admin_can_deactivate_user(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $warehouseUser = User::where('email', 'warehouse@test.com')->first();
        $this->actingAs($admin);

        $response = $this->postJson("/api/users/{$warehouseUser->id}/deactivate");

        $response->assertStatus(200);
        $this->assertFalse($response->json('is_active'));

        // Verify user is deactivated
        $warehouseUser->refresh();
        $this->assertFalse($warehouseUser->is_active);
    }

    public function test_admin_can_delete_user_without_history(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        // A freshly created user has no ledger/cycle-count/audit history
        $fresh = User::create([
            'name' => 'Temp User',
            'email' => 'temp@test.com',
            'password' => bcrypt('password123'),
            'role' => 'warehouse_staff',
            'is_active' => true,
        ]);

        $response = $this->deleteJson("/api/users/{$fresh->id}");

        $response->assertStatus(204);
        $this->assertNull(User::find($fresh->id));
    }

    public function test_admin_cannot_delete_user_with_history(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        // Seeded warehouse staff owns demo cycle counts / ledger rows
        $warehouseUser = User::where('email', 'warehouse@test.com')->first();
        $this->actingAs($admin);

        $response = $this->deleteJson("/api/users/{$warehouseUser->id}");

        $response->assertStatus(409);
        $this->assertNotNull(User::find($warehouseUser->id));
    }

    public function test_admin_cannot_delete_self(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->deleteJson("/api/users/{$admin->id}");

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'You cannot delete your own account.');
    }

    public function test_admin_cannot_create_user_without_role(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'new@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('role');
    }

    public function test_admin_cannot_create_user_with_invalid_role(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'new@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'invalid_role',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('role');
    }

    public function test_admin_can_view_single_user(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $warehouseUser = User::where('email', 'warehouse@test.com')->first();
        $this->actingAs($admin);

        $response = $this->getJson("/api/users/{$warehouseUser->id}");

        $response->assertStatus(200);
        $this->assertEquals('warehouse@test.com', $response->json('email'));
    }

    public function test_admin_gets_404_for_nonexistent_user(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->getJson('/api/users/999999');

        $response->assertStatus(404);
    }
}
