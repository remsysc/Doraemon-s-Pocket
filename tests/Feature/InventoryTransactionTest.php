<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryTransaction;
use App\Models\Lot;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTransactionTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    private function purchasingManager(): User
    {
        return User::factory()->purchasingManager()->create();
    }

    private function warehouseStaff(): User
    {
        return User::factory()->warehouseStaff()->create();
    }

    /**
     * Create the full fixture chain: Category → Product → Lot.
     * Returns the Lot so tests can reference lot_id directly.
     */
    private function makeLot(): Lot
    {
        $category = Category::create([
            'name' => 'Air Conditioners',
            'slug' => 'air-conditioners',
        ]);

        $product = Product::create([
            'name'            => 'Portable AC',
            'barcode'         => 'BC-AC-001',
            'unit_of_measure' => 'unit',
            'is_seasonal'     => true,
            'is_active'       => true,
            'category_id'     => $category->category_id,
        ]);

        return Lot::create([
            'sku_id'        => $product->sku_id,
            'received_date' => now()->toDateTimeString(),
            'expiry_date'   => now()->addYear()->toDateString(),
            'bin_location'  => 'A1',
        ]);
    }

    /**
     * Create a persisted transaction fixture directly (bypasses HTTP).
     * Always requires an explicit actor so the NOT NULL constraint is satisfied.
     */
    private function makeTransaction(Lot $lot, User $actor, array $overrides = []): InventoryTransaction
    {
        return InventoryTransaction::create(array_merge([
            'lot_id'     => $lot->lot_id,
            'actor_id'   => $actor->id,
            'txn_type'   => 'in',
            'qty_delta'  => 5,
            'occured_at' => now(),
        ], $overrides));
    }

    private function validPayload(Lot $lot): array
    {
        return [
            'lot_id'     => $lot->lot_id,
            'txn_type'   => 'in',
            'qty_delta'  => 10,
            'occured_at' => now()->toDateTimeString(),
        ];
    }

    // -------------------------------------------------------------------------
    // RBAC — index (GET /api/inventory-transactions)
    // All authenticated roles can read (SPEC §7.x, FR-20)
    // -------------------------------------------------------------------------

    public function test_warehouse_staff_can_list_transactions(): void
    {
        $this->actingAs($this->warehouseStaff())
            ->getJson('/api/inventory-transactions')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_purchasing_manager_can_list_transactions(): void
    {
        $this->actingAs($this->purchasingManager())
            ->getJson('/api/inventory-transactions')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_admin_can_list_transactions(): void
    {
        $this->actingAs($this->admin())
            ->getJson('/api/inventory-transactions')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_guest_cannot_list_transactions(): void
    {
        $this->getJson('/api/inventory-transactions')
            ->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // RBAC — show (GET /api/inventory-transactions/{id})
    // All authenticated roles can read (SPEC §7.x, FR-20)
    // -------------------------------------------------------------------------

    public function test_warehouse_staff_can_view_a_transaction(): void
    {
        $lot  = $this->makeLot();
        $actor = $this->warehouseStaff();
        $txn  = $this->makeTransaction($lot, $actor);

        $this->actingAs($this->warehouseStaff())
            ->getJson("/api/inventory-transactions/{$txn->txn_id}")
            ->assertOk()
            ->assertJsonPath('data.id', $txn->txn_id);
    }

    public function test_purchasing_manager_can_view_a_transaction(): void
    {
        $lot   = $this->makeLot();
        $actor = $this->warehouseStaff();
        $txn   = $this->makeTransaction($lot, $actor, ['txn_type' => 'out', 'qty_delta' => -3]);

        $this->actingAs($this->purchasingManager())
            ->getJson("/api/inventory-transactions/{$txn->txn_id}")
            ->assertOk()
            ->assertJsonPath('data.id', $txn->txn_id);
    }

    public function test_admin_can_view_a_transaction(): void
    {
        $lot   = $this->makeLot();
        $actor = $this->warehouseStaff();
        $txn   = $this->makeTransaction($lot, $actor, ['qty_delta' => 20]);

        $this->actingAs($this->admin())
            ->getJson("/api/inventory-transactions/{$txn->txn_id}")
            ->assertOk()
            ->assertJsonPath('data.id', $txn->txn_id);
    }

    // -------------------------------------------------------------------------
    // RBAC — store (POST /api/inventory-transactions)
    // Warehouse Staff + Admin can create; Purchasing Manager cannot (SPEC FR-34)
    // -------------------------------------------------------------------------

    public function test_warehouse_staff_can_create_a_transaction(): void
    {
        $lot  = $this->makeLot();
        $user = $this->warehouseStaff();

        $response = $this->actingAs($user)
            ->postJson('/api/inventory-transactions', $this->validPayload($lot));

        $response->assertCreated()
            ->assertJsonPath('data.type', 'in')
            ->assertJsonPath('data.quantity_delta', 10);

        $this->assertDatabaseHas('inventory_transactions', [
            'lot_id'    => $lot->lot_id,
            'txn_type'  => 'in',
            'qty_delta' => 10,
            'actor_id'  => $user->id,
        ]);
    }

    public function test_admin_can_create_a_transaction(): void
    {
        $lot  = $this->makeLot();
        $user = $this->admin();

        $this->actingAs($user)
            ->postJson('/api/inventory-transactions', $this->validPayload($lot))
            ->assertCreated();

        $this->assertDatabaseHas('inventory_transactions', [
            'lot_id'   => $lot->lot_id,
            'actor_id' => $user->id,
        ]);
    }

    public function test_purchasing_manager_cannot_create_a_transaction(): void
    {
        $lot = $this->makeLot();

        $this->actingAs($this->purchasingManager())
            ->postJson('/api/inventory-transactions', $this->validPayload($lot))
            ->assertForbidden();

        $this->assertDatabaseEmpty('inventory_transactions');
    }

    public function test_guest_cannot_create_a_transaction(): void
    {
        $lot = $this->makeLot();

        $this->postJson('/api/inventory-transactions', $this->validPayload($lot))
            ->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // actor_id is always set server-side — never from client input (SPEC FR-20)
    // -------------------------------------------------------------------------

    public function test_actor_id_is_set_from_authenticated_user_not_client(): void
    {
        $lot      = $this->makeLot();
        $user     = $this->warehouseStaff();
        $imposter = $this->admin();

        // Attempt to supply a different actor_id in the body — must be ignored.
        $payload = array_merge($this->validPayload($lot), ['actor_id' => $imposter->id]);

        $this->actingAs($user)
            ->postJson('/api/inventory-transactions', $payload)
            ->assertCreated();

        $this->assertDatabaseHas('inventory_transactions', [
            'lot_id'   => $lot->lot_id,
            'actor_id' => $user->id,   // authenticated user, not the imposter
        ]);
        $this->assertDatabaseMissing('inventory_transactions', [
            'lot_id'   => $lot->lot_id,
            'actor_id' => $imposter->id,
        ]);
    }

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    public function test_store_requires_lot_id(): void
    {
        $payload = $this->validPayload($this->makeLot());
        unset($payload['lot_id']);

        $this->actingAs($this->warehouseStaff())
            ->postJson('/api/inventory-transactions', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['lot_id']);
    }

    public function test_store_rejects_nonexistent_lot_id(): void
    {
        $payload = array_merge($this->validPayload($this->makeLot()), [
            'lot_id' => 'nonexistent-lot-uuid',
        ]);

        $this->actingAs($this->warehouseStaff())
            ->postJson('/api/inventory-transactions', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['lot_id']);
    }

    public function test_store_requires_txn_type(): void
    {
        $payload = $this->validPayload($this->makeLot());
        unset($payload['txn_type']);

        $this->actingAs($this->warehouseStaff())
            ->postJson('/api/inventory-transactions', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['txn_type']);
    }

    public function test_store_rejects_invalid_txn_type(): void
    {
        $payload = array_merge($this->validPayload($this->makeLot()), [
            'txn_type' => 'PICK',  // old enum value from spec; migration only has in/out
        ]);

        $this->actingAs($this->warehouseStaff())
            ->postJson('/api/inventory-transactions', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['txn_type']);
    }

    public function test_store_requires_qty_delta(): void
    {
        $payload = $this->validPayload($this->makeLot());
        unset($payload['qty_delta']);

        $this->actingAs($this->warehouseStaff())
            ->postJson('/api/inventory-transactions', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['qty_delta']);
    }

    public function test_store_rejects_zero_qty_delta(): void
    {
        $payload = array_merge($this->validPayload($this->makeLot()), [
            'qty_delta' => 0,
        ]);

        $this->actingAs($this->warehouseStaff())
            ->postJson('/api/inventory-transactions', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['qty_delta']);
    }

    public function test_store_requires_occured_at(): void
    {
        $payload = $this->validPayload($this->makeLot());
        unset($payload['occured_at']);

        $this->actingAs($this->warehouseStaff())
            ->postJson('/api/inventory-transactions', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['occured_at']);
    }

    public function test_store_rejects_invalid_occured_at(): void
    {
        $payload = array_merge($this->validPayload($this->makeLot()), [
            'occured_at' => 'not-a-date',
        ]);

        $this->actingAs($this->warehouseStaff())
            ->postJson('/api/inventory-transactions', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['occured_at']);
    }

    // -------------------------------------------------------------------------
    // Append-only: no update or delete route exists (SPEC FR-21)
    // -------------------------------------------------------------------------

    public function test_update_route_does_not_exist(): void
    {
        $lot  = $this->makeLot();
        $user = $this->admin();
        $txn  = $this->makeTransaction($lot, $user);

        $this->actingAs($user)
            ->putJson("/api/inventory-transactions/{$txn->txn_id}", [])
            ->assertMethodNotAllowed();

        $this->actingAs($user)
            ->patchJson("/api/inventory-transactions/{$txn->txn_id}", [])
            ->assertMethodNotAllowed();
    }

    public function test_delete_route_does_not_exist(): void
    {
        $lot  = $this->makeLot();
        $user = $this->admin();
        $txn  = $this->makeTransaction($lot, $user);

        $this->actingAs($user)
            ->deleteJson("/api/inventory-transactions/{$txn->txn_id}")
            ->assertMethodNotAllowed();
    }

    // -------------------------------------------------------------------------
    // Response shape
    // -------------------------------------------------------------------------

    public function test_store_response_shape(): void
    {
        $lot  = $this->makeLot();
        $user = $this->warehouseStaff();

        $this->actingAs($user)
            ->postJson('/api/inventory-transactions', $this->validPayload($lot))
            ->assertCreated()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'type',
                    'quantity_delta',
                    'occured_at',
                    'created_at',
                ],
            ]);
    }

    public function test_index_returns_paginated_collection(): void
    {
        $lot  = $this->makeLot();
        $user = $this->warehouseStaff();

        $this->makeTransaction($lot, $user, ['qty_delta' => 5]);
        $this->makeTransaction($lot, $user, ['txn_type' => 'out', 'qty_delta' => -2]);

        $this->actingAs($user)
            ->getJson('/api/inventory-transactions')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure(['data', 'links', 'meta']);
    }
}
