<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_audit_logs_with_actor_and_pagination(): void
    {
        $admin = User::factory()->admin()->create();
        $actor = User::factory()->warehouseStaff()->create();

        AuditLog::factory()->for($actor, "actor")->create([
            "action" => "CREATE_PRODUCT",
            "entity_type" => "Product",
        ]);
        AuditLog::factory()->for($actor, "actor")->create([
            "action" => "UPDATE_LOT",
            "entity_type" => "Lot",
        ]);

        $this->actingAs($admin)
            ->getJson("/api/audit-logs?per_page=1")
            ->assertOk()
            ->assertJsonCount(1, "data")
            ->assertJsonStructure([
                "data" => [[
                    "id",
                    "actor",
                    "action",
                    "entity_type",
                    "entity_id",
                    "old_values",
                    "new_values",
                    "occurred_at",
                ]],
                "links",
                "meta",
            ])
            ->assertJsonPath("data.0.actor.id", $actor->id);
    }

    public function test_admin_can_view_audit_log_using_route_model_binding(): void
    {
        $admin = User::factory()->admin()->create();
        $actor = User::factory()->warehouseStaff()->create();
        $auditLog = AuditLog::factory()->for($actor, "actor")->create([
            "action" => "UPDATE_PRODUCT",
            "entity_type" => "Product",
        ]);

        $this->actingAs($admin)
            ->getJson("/api/audit-logs/{$auditLog->audit_id}")
            ->assertOk()
            ->assertJsonPath("data.id", $auditLog->audit_id)
            ->assertJsonPath("data.action", "UPDATE_PRODUCT")
            ->assertJsonPath("data.actor.id", $actor->id);
    }

    public function test_non_admin_roles_cannot_list_or_view_audit_logs(): void
    {
        $auditLog = AuditLog::factory()->create();

        foreach (["purchasingManager", "warehouseStaff"] as $role) {
            $user = User::factory()->{$role}()->create();

            $this->actingAs($user)
                ->getJson("/api/audit-logs")
                ->assertForbidden();

            $this->actingAs($user)
                ->getJson("/api/audit-logs/{$auditLog->audit_id}")
                ->assertForbidden();
        }
    }

    public function test_guest_cannot_list_or_view_audit_logs(): void
    {
        $auditLog = AuditLog::factory()->create();

        $this->getJson("/api/audit-logs")
            ->assertUnauthorized();

        $this->getJson("/api/audit-logs/{$auditLog->audit_id}")
            ->assertUnauthorized();
    }

    public function test_audit_logs_have_no_public_mutation_routes(): void
    {
        $admin = User::factory()->admin()->create();
        $auditLog = AuditLog::factory()->create();

        $this->actingAs($admin)
            ->postJson("/api/audit-logs", [])
            ->assertMethodNotAllowed();

        $this->actingAs($admin)
            ->putJson("/api/audit-logs/{$auditLog->audit_id}", [])
            ->assertMethodNotAllowed();

        $this->actingAs($admin)
            ->deleteJson("/api/audit-logs/{$auditLog->audit_id}")
            ->assertMethodNotAllowed();
    }
}
