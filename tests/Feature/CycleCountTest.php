<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CycleCount;
use App\Models\InventorySnapshot;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CycleCountTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_warehouse_staff_can_create_cycle_count(): void
    {
        $user = User::where('email', 'warehouse@test.com')->first();
        $product = Product::first();
        $snapshot = InventorySnapshot::where('sku_id', $product->sku_id)->first();

        $this->actingAs($user);

        $response = $this->postJson('/api/cycle-counts', [
            'sku_id' => $product->sku_id,
            'counted_qty' => 100,
            'notes' => 'Monthly count',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'id',
            'sku_id',
            'counted_by',
            'counter_name',
            'expected_qty',
            'counted_qty',
            'variance_qty',
            'variance_pct',
            'is_flagged',
            'status',
            'notes',
        ]);

        $this->assertEquals(100, $response->json('counted_qty'));
        $this->assertEquals($snapshot->qty_on_hand, $response->json('expected_qty'));
    }

    public function test_purchasing_manager_cannot_create_cycle_count(): void
    {
        $user = User::where('email', 'purchasing@test.com')->first();
        $product = Product::first();

        $this->actingAs($user);

        $response = $this->postJson('/api/cycle-counts', [
            'sku_id' => $product->sku_id,
            'counted_qty' => 100,
        ]);

        $response->assertStatus(403);
    }

    public function test_guest_cannot_create_cycle_count(): void
    {
        $product = Product::first();

        $response = $this->postJson('/api/cycle-counts', [
            'sku_id' => $product->sku_id,
            'counted_qty' => 100,
        ]);

        $response->assertStatus(401);
    }

    public function test_warehouse_staff_can_view_own_counts(): void
    {
        $user = User::where('email', 'warehouse@test.com')->first();
        $product = Product::first();
        $snapshot = InventorySnapshot::where('sku_id', $product->sku_id)->first();

        $this->actingAs($user);

        $count = CycleCount::create([
            'sku_id' => $product->sku_id,
            'counted_by' => $user->id,
            'counter_name' => $user->name,
            'expected_qty' => $snapshot->qty_on_hand,
            'counted_qty' => 100,
            'variance_qty' => 100 - $snapshot->qty_on_hand,
            'variance_pct' => 0.0,
            'is_flagged' => false,
            'status' => 'pending',
            'counted_at' => now(),
        ]);

        $response = $this->getJson('/api/cycle-counts');

        $response->assertStatus(200);
        // WS sees only their own counts; the created one must be present
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertContains($count->id, $ids->all());
        $countedBy = collect($response->json('data'))->pluck('counted_by')->unique();
        $this->assertEquals([$user->id], $countedBy->values()->all());
    }

    public function test_warehouse_staff_cannot_view_other_users_counts(): void
    {
        $warehouseUser = User::where('email', 'warehouse@test.com')->first();
        $adminUser = User::where('email', 'admin@test.com')->first();
        $product = Product::first();
        $snapshot = InventorySnapshot::where('sku_id', $product->sku_id)->first();

        $this->actingAs($warehouseUser);

        // Create count owned by admin
        $adminCount = CycleCount::create([
            'sku_id' => $product->sku_id,
            'counted_by' => $adminUser->id,
            'counter_name' => $adminUser->name,
            'expected_qty' => $snapshot->qty_on_hand,
            'counted_qty' => 100,
            'variance_qty' => 100 - $snapshot->qty_on_hand,
            'variance_pct' => 0.0,
            'is_flagged' => false,
            'status' => 'pending',
            'counted_at' => now(),
        ]);

        $response = $this->getJson('/api/cycle-counts');

        $response->assertStatus(200);
        // The warehouse user must never see the admin-owned count, and every
        // returned row must belong to them.
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertNotContains($adminCount->id, $ids->all());
        $ownerIds = collect($response->json('data'))->pluck('counted_by')->unique()->values()->all();
        $this->assertTrue($ownerIds === [] || $ownerIds === [$warehouseUser->id]);
    }

    public function test_admin_can_view_all_counts(): void
    {
        $user = User::where('email', 'admin@test.com')->first();
        $product = Product::first();
        $snapshot = InventorySnapshot::where('sku_id', $product->sku_id)->first();

        $this->actingAs($user);

        // Create count for another user
        $warehouseUser = User::where('email', 'warehouse@test.com')->first();
        $created = CycleCount::create([
            'sku_id' => $product->sku_id,
            'counted_by' => $warehouseUser->id,
            'counter_name' => $warehouseUser->name,
            'expected_qty' => $snapshot->qty_on_hand,
            'counted_qty' => 100,
            'variance_qty' => 100 - $snapshot->qty_on_hand,
            'variance_pct' => 0.0,
            'is_flagged' => false,
            'status' => 'pending',
            'counted_at' => now(),
        ]);

        $response = $this->getJson('/api/cycle-counts');

        $response->assertStatus(200);
        // Admin sees counts from multiple owners, including the WS-owned one
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertContains($created->id, $ids->all());
    }

    public function test_admin_can_reconcile_cycle_count(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $product = Product::first();
        $snapshot = InventorySnapshot::where('sku_id', $product->sku_id)->first();

        $this->actingAs($admin);

        $count = CycleCount::create([
            'sku_id' => $product->sku_id,
            'counted_by' => $admin->id,
            'counter_name' => $admin->name,
            'expected_qty' => $snapshot->qty_on_hand,
            'counted_qty' => $snapshot->qty_on_hand + 10, // +10 variance
            'variance_qty' => 10,
            'variance_pct' => 10.0,
            'is_flagged' => true,
            'status' => 'pending',
            'counted_at' => now(),
        ]);

        $response = $this->postJson("/api/cycle-counts/{$count->id}/reconcile");

        $response->assertStatus(200);

        // Verify status changed
        $this->assertEquals('reconciled', $response->json('status'));

        // Verify an ADJUSTMENT transaction was recorded and linked
        $count->refresh();
        $this->assertNotNull($count->reconciliation_txn_id);
        $txn = InventoryTransaction::where('txn_id', $count->reconciliation_txn_id)->first();
        $this->assertNotNull($txn);
        $this->assertEquals('ADJUSTMENT', $txn->txn_type);

        // Verify snapshot on-hand now matches the counted quantity
        $snapshot->refresh();
        $this->assertEquals($count->counted_qty, $snapshot->qty_on_hand);
    }

    public function test_warehouse_staff_cannot_reconcile_cycle_count(): void
    {
        $warehouseUser = User::where('email', 'warehouse@test.com')->first();
        $product = Product::first();
        $snapshot = InventorySnapshot::where('sku_id', $product->sku_id)->first();

        $this->actingAs($warehouseUser);

        $count = CycleCount::create([
            'sku_id' => $product->sku_id,
            'counted_by' => $warehouseUser->id,
            'counter_name' => $warehouseUser->name,
            'expected_qty' => $snapshot->qty_on_hand,
            'counted_qty' => $snapshot->qty_on_hand + 10,
            'variance_qty' => 10,
            'variance_pct' => 10.0,
            'is_flagged' => true,
            'status' => 'pending',
            'counted_at' => now(),
        ]);

        $response = $this->postJson("/api/cycle-counts/{$count->id}/reconcile");

        $response->assertStatus(403);
    }

    public function test_admin_can_dismiss_cycle_count(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $product = Product::first();
        $snapshot = InventorySnapshot::where('sku_id', $product->sku_id)->first();

        $this->actingAs($admin);

        $count = CycleCount::create([
            'sku_id' => $product->sku_id,
            'counted_by' => $admin->id,
            'counter_name' => $admin->name,
            'expected_qty' => $snapshot->qty_on_hand,
            'counted_qty' => $snapshot->qty_on_hand + 10,
            'variance_qty' => 10,
            'variance_pct' => 10.0,
            'is_flagged' => true,
            'status' => 'pending',
            'counted_at' => now(),
        ]);

        $response = $this->postJson("/api/cycle-counts/{$count->id}/dismiss", [
            'notes' => 'False alarm - counted correctly.',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('dismissed', $response->json('status'));
        $this->assertEquals('False alarm - counted correctly.', $response->json('notes'));
    }

    public function test_variance_threshold_flagging_works(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $product = Product::first();
        $snapshot = InventorySnapshot::where('sku_id', $product->sku_id)->first();

        $this->actingAs($admin);

        // Create count with a variance below the 5% threshold
        $expected = $snapshot->qty_on_hand;
        $counted = $expected + (int) floor($expected * 0.03); // ~3% over

        $response = $this->postJson('/api/cycle-counts', [
            'sku_id' => $product->sku_id,
            'counted_qty' => $counted,
            'notes' => 'Small variance',
        ]);

        $response->assertStatus(201);
        $this->assertFalse($response->json('is_flagged'));
        $this->assertLessThanOrEqual(5.0, abs((float) $response->json('variance_pct')));
    }

    public function test_cycle_count_requires_valid_sku_id(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();

        $this->actingAs($admin);

        $response = $this->postJson('/api/cycle-counts', [
            'sku_id' => 'invalid-uuid',
            'counted_qty' => 100,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('sku_id');
    }

    public function test_cycle_count_requires_positive_counted_qty(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $product = Product::first();

        $this->actingAs($admin);

        $response = $this->postJson('/api/cycle-counts', [
            'sku_id' => $product->sku_id,
            'counted_qty' => -1,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('counted_qty');
    }
}
