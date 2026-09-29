<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Lot;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * RBAC guard tests for Sprint 6: covers FR-32–FR-38 (existing endpoints)
 * and FR-39–FR-41 (Supplier and Purchase Order endpoints).
 */
class RbacSprintSixTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------------ Helpers

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    private function pm(): User
    {
        return User::factory()->purchasingManager()->create();
    }

    private function ws(): User
    {
        return User::factory()->warehouseStaff()->create();
    }

    private function makeProduct(): Product
    {
        $category = Category::factory()->create();

        return Product::factory()->create(['category_id' => $category->category_id]);
    }

    private function makeSupplier(): Supplier
    {
        return Supplier::factory()->create();
    }

    // ------------------------------------------------------------------ FR-32: reorder-configs

    public function test_admin_and_pm_can_list_reorder_configs(): void
    {
        $this->actingAs($this->admin())->getJson('/api/reorder-configs')->assertOk();
        $this->actingAs($this->pm())->getJson('/api/reorder-configs')->assertOk();
    }

    public function test_warehouse_staff_cannot_read_reorder_configs(): void
    {
        $this->actingAs($this->ws())->getJson('/api/reorder-configs')->assertForbidden();
    }

    public function test_warehouse_staff_cannot_write_reorder_configs(): void
    {
        $product = $this->makeProduct();
        $this->actingAs($this->ws())
            ->postJson('/api/reorder-configs', ['sku_id' => $product->sku_id, 'lead_time_days' => 5])
            ->assertForbidden();
    }

    // ------------------------------------------------------------------ FR-35: alerts

    public function test_admin_and_pm_can_view_reorder_and_expiry_alerts(): void
    {
        $this->actingAs($this->admin())->getJson('/api/alerts/reorder')->assertOk();
        $this->actingAs($this->admin())->getJson('/api/alerts/expiry')->assertOk();
        $this->actingAs($this->pm())->getJson('/api/alerts/reorder')->assertOk();
        $this->actingAs($this->pm())->getJson('/api/alerts/expiry')->assertOk();
    }

    public function test_warehouse_staff_cannot_view_alerts(): void
    {
        $this->actingAs($this->ws())->getJson('/api/alerts/reorder')->assertForbidden();
        $this->actingAs($this->ws())->getJson('/api/alerts/expiry')->assertForbidden();
    }

    // ------------------------------------------------------------------ FR-36: cycle-counts

    public function test_warehouse_staff_can_submit_cycle_count(): void
    {
        $product = $this->makeProduct();
        $this->actingAs($this->ws())
            ->postJson('/api/cycle-counts', [
                'sku_id' => $product->sku_id,
                'counted_qty' => 10,
                'notes' => 'Test count',
            ])
            ->assertCreated();
    }

    public function test_purchasing_manager_cannot_submit_cycle_count(): void
    {
        $product = $this->makeProduct();
        $this->actingAs($this->pm())
            ->postJson('/api/cycle-counts', [
                'sku_id' => $product->sku_id,
                'counted_qty' => 10,
            ])
            ->assertForbidden();
    }

    // ------------------------------------------------------------------ FR-37: audit-logs

    public function test_admin_can_view_audit_logs(): void
    {
        $this->actingAs($this->admin())->getJson('/api/audit-logs')->assertOk();
    }

    public function test_pm_and_ws_cannot_view_audit_logs(): void
    {
        $this->actingAs($this->pm())->getJson('/api/audit-logs')->assertForbidden();
        $this->actingAs($this->ws())->getJson('/api/audit-logs')->assertForbidden();
    }

    // ------------------------------------------------------------------ FR-38: user management

    public function test_admin_can_list_users(): void
    {
        $this->actingAs($this->admin())->getJson('/api/users')->assertOk();
    }

    public function test_pm_cannot_manage_users(): void
    {
        $this->actingAs($this->pm())->getJson('/api/users')->assertForbidden();
        $this->actingAs($this->pm())
            ->postJson('/api/users', ['name' => 'X', 'email' => 'x@test.com', 'password' => 'password', 'role' => 'admin'])
            ->assertForbidden();
    }

    public function test_ws_cannot_manage_users(): void
    {
        $this->actingAs($this->ws())->getJson('/api/users')->assertForbidden();
        $this->actingAs($this->ws())
            ->postJson('/api/users', ['name' => 'X', 'email' => 'x@test.com', 'password' => 'password', 'role' => 'admin'])
            ->assertForbidden();
    }

    // ------------------------------------------------------------------ FR-39: suppliers

    public function test_all_roles_can_list_suppliers(): void
    {
        $this->actingAs($this->admin())->getJson('/api/suppliers')->assertOk();
        $this->actingAs($this->pm())->getJson('/api/suppliers')->assertOk();
        $this->actingAs($this->ws())->getJson('/api/suppliers')->assertOk();
    }

    public function test_admin_and_pm_can_create_supplier(): void
    {
        $payload = ['name' => 'Test Supplier Co.', 'lead_time_days' => 7];

        $this->actingAs($this->admin())->postJson('/api/suppliers', $payload)->assertCreated();
        $this->actingAs($this->pm())->postJson('/api/suppliers', $payload)->assertCreated();
    }

    public function test_warehouse_staff_cannot_create_supplier(): void
    {
        $this->actingAs($this->ws())
            ->postJson('/api/suppliers', ['name' => 'Rogue Supplier'])
            ->assertForbidden();
    }

    public function test_warehouse_staff_cannot_update_or_delete_supplier(): void
    {
        $supplier = $this->makeSupplier();
        $ws = $this->ws();

        $this->actingAs($ws)
            ->putJson("/api/suppliers/{$supplier->id}", ['name' => 'Changed'])
            ->assertForbidden();

        $this->actingAs($ws)
            ->deleteJson("/api/suppliers/{$supplier->id}")
            ->assertForbidden();
    }

    // ------------------------------------------------------------------ FR-40: purchase-orders

    public function test_all_roles_can_list_purchase_orders(): void
    {
        $this->actingAs($this->admin())->getJson('/api/purchase-orders')->assertOk();
        $this->actingAs($this->pm())->getJson('/api/purchase-orders')->assertOk();
        $this->actingAs($this->ws())->getJson('/api/purchase-orders')->assertOk();
    }

    public function test_admin_and_pm_can_create_purchase_order(): void
    {
        $supplier = $this->makeSupplier();
        $payload = ['supplier_id' => $supplier->id, 'notes' => 'Test PO'];

        $this->actingAs($this->admin())->postJson('/api/purchase-orders', $payload)->assertCreated();
        $this->actingAs($this->pm())->postJson('/api/purchase-orders', $payload)->assertCreated();
    }

    public function test_warehouse_staff_cannot_create_purchase_order(): void
    {
        $supplier = $this->makeSupplier();
        $this->actingAs($this->ws())
            ->postJson('/api/purchase-orders', ['supplier_id' => $supplier->id])
            ->assertForbidden();
    }

    // ------------------------------------------------------------------ FR-41: receive

    public function test_warehouse_staff_can_call_receive_endpoint(): void
    {
        $supplier = $this->makeSupplier();
        $product = $this->makeProduct();

        $po = $this->actingAs($this->admin())
            ->postJson('/api/purchase-orders', [
                'supplier_id' => $supplier->id,
                'items' => [
                    ['sku_id' => $product->sku_id, 'quantity_ordered' => 5],
                ],
            ])
            ->assertCreated()
            ->json('data');

        // Warehouse Staff can trigger receive
        $this->actingAs($this->ws())
            ->postJson("/api/purchase-orders/{$po['id']}/receive", [
                'items' => [
                    ['sku_id' => $product->sku_id, 'qty_received' => 5],
                ],
            ])
            ->assertOk();
    }

    public function test_purchasing_manager_cannot_call_receive_endpoint(): void
    {
        $supplier = $this->makeSupplier();
        $product = $this->makeProduct();

        $po = $this->actingAs($this->admin())
            ->postJson('/api/purchase-orders', [
                'supplier_id' => $supplier->id,
                'items' => [
                    ['sku_id' => $product->sku_id, 'quantity_ordered' => 5],
                ],
            ])
            ->assertCreated()
            ->json('data');

        $this->actingAs($this->pm())
            ->postJson("/api/purchase-orders/{$po['id']}/receive", [
                'items' => [
                    ['sku_id' => $product->sku_id, 'qty_received' => 5],
                ],
            ])
            ->assertForbidden();
    }

    // ------------------------------------------------------------------ PO status transitions

    public function test_invalid_status_transition_returns_422(): void
    {
        $supplier = $this->makeSupplier();
        $pm = $this->pm();

        $po = $this->actingAs($pm)
            ->postJson('/api/purchase-orders', ['supplier_id' => $supplier->id])
            ->assertCreated()
            ->json('data');

        // Cannot jump from draft to received (must go draft→ordered first)
        $this->actingAs($pm)
            ->putJson("/api/purchase-orders/{$po['id']}", ['status' => 'received'])
            ->assertUnprocessable();
    }

    public function test_valid_status_transition_succeeds(): void
    {
        $supplier = $this->makeSupplier();
        $pm = $this->pm();

        $po = $this->actingAs($pm)
            ->postJson('/api/purchase-orders', ['supplier_id' => $supplier->id])
            ->assertCreated()
            ->json('data');

        // draft → ordered is valid
        $this->actingAs($pm)
            ->putJson("/api/purchase-orders/{$po['id']}", ['status' => 'ordered'])
            ->assertOk()
            ->assertJsonPath('data.status', 'ordered');
    }

    // ------------------------------------------------------------------ FR-33: Lot writes

    public function test_admin_and_warehouse_staff_can_create_lots(): void
    {
        $product = $this->makeProduct();
        $payload = [
            'sku_id' => $product->sku_id,
            'bin_location' => 'BIN-101',
            'received_date' => now()->toIso8601String(),
        ];

        $this->actingAs($this->admin())->postJson('/api/lots', $payload)->assertCreated();
        $this->actingAs($this->ws())->postJson('/api/lots', [
            'sku_id' => $product->sku_id,
            'bin_location' => 'BIN-102',
            'received_date' => now()->toIso8601String(),
        ])->assertCreated();
    }

    public function test_purchasing_manager_cannot_create_lots(): void
    {
        $product = $this->makeProduct();
        $this->actingAs($this->pm())->postJson('/api/lots', [
            'sku_id' => $product->sku_id,
            'bin_location' => 'BIN-103',
            'received_date' => now()->toIso8601String(),
        ])->assertForbidden();
    }

    // ------------------------------------------------------------------ FR-34: Inventory Transactions

    public function test_admin_and_warehouse_staff_can_create_inventory_transactions(): void
    {
        $product = $this->makeProduct();
        $lot = Lot::create([
            'sku_id' => $product->sku_id,
            'bin_location' => 'BIN-200',
            'received_date' => now(),
        ]);

        $payload = [
            'lot_id' => $lot->lot_id,
            'txn_type' => 'RECEIPT',
            'qty_delta' => 10,
            'occurred_at' => now()->toIso8601String(),
        ];

        $this->actingAs($this->admin())->postJson('/api/inventory-transactions', $payload)->assertCreated();
        $this->actingAs($this->ws())->postJson('/api/inventory-transactions', [
            'lot_id' => $lot->lot_id,
            'txn_type' => 'RECEIPT',
            'qty_delta' => 5,
            'occurred_at' => now()->toIso8601String(),
        ])->assertCreated();
    }

    public function test_purchasing_manager_cannot_create_inventory_transactions(): void
    {
        $product = $this->makeProduct();
        $lot = Lot::create([
            'sku_id' => $product->sku_id,
            'bin_location' => 'BIN-201',
            'received_date' => now(),
        ]);

        $this->actingAs($this->pm())->postJson('/api/inventory-transactions', [
            'lot_id' => $lot->lot_id,
            'txn_type' => 'RECEIPT',
            'qty_delta' => 10,
            'occurred_at' => now()->toIso8601String(),
        ])->assertForbidden();
    }

    // ------------------------------------------------------------------ Reports (Admin only)

    public function test_admin_can_view_reports_and_others_are_forbidden(): void
    {
        $this->actingAs($this->admin())->getJson('/api/reports/turnover')->assertOk();
        $this->actingAs($this->admin())->getJson('/api/reports/variance')->assertOk();

        $this->actingAs($this->pm())->getJson('/api/reports/turnover')->assertForbidden();
        $this->actingAs($this->pm())->getJson('/api/reports/variance')->assertForbidden();

        $this->actingAs($this->ws())->getJson('/api/reports/turnover')->assertForbidden();
        $this->actingAs($this->ws())->getJson('/api/reports/variance')->assertForbidden();
    }

    // ------------------------------------------------------------------ Data Management (Admin only)

    public function test_admin_can_access_data_management_and_others_are_forbidden(): void
    {
        $this->actingAs($this->admin())->get('/api/data/export/categories')->assertOk();
        $this->actingAs($this->admin())->get('/api/data/export/products')->assertOk();

        $this->actingAs($this->pm())->getJson('/api/data/export/categories')->assertForbidden();
        $this->actingAs($this->ws())->getJson('/api/data/export/categories')->assertForbidden();
    }
}
