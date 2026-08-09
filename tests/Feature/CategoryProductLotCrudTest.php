<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Lot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryProductLotCrudTest extends TestCase
{
    use RefreshDatabase;

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

    // ---- Category: Admin only (2026-08-04 RBAC refinement) ----

    public function test_category_full_crud_as_admin(): void
    {
        $user = $this->admin();

        $create = $this->actingAs($user)->postJson("/api/categories", [
            "name" => "Air Conditioners",
            "slug" => "air-conditioners",
            "description" => "AC units",
        ]);
        $create->assertCreated();
        $categoryId = $create->json("data.id");

        $this->actingAs($user)->getJson("/api/categories")->assertOk();
        $this->actingAs($user)
            ->getJson("/api/categories/{$categoryId}")
            ->assertOk();

        $update = $this->actingAs($user)->putJson(
            "/api/categories/{$categoryId}",
            [
                "name" => "AC Units",
            ],
        );
        $update->assertOk();

        $delete = $this->actingAs($user)->deleteJson(
            "/api/categories/{$categoryId}",
        );
        $delete->assertNoContent();
    }

    public function test_purchasing_manager_cannot_write_category(): void
    {
        $user = $this->purchasingManager();

        $this->actingAs($user)
            ->postJson("/api/categories", [
                "name" => "Nope",
                "slug" => "nope",
            ])
            ->assertForbidden();

        $category = Category::create([
            "name" => "Purifiers",
            "slug" => "purifiers",
        ]);

        $this->actingAs($user)
            ->putJson("/api/categories/{$category->category_id}", ["name" => "Nope"])
            ->assertForbidden();
        $this->actingAs($user)
            ->deleteJson("/api/categories/{$category->category_id}")
            ->assertForbidden();

        // Read access is unaffected.
        $this->actingAs($user)->getJson("/api/categories")->assertOk();
    }

    public function test_warehouse_staff_cannot_write_category(): void
    {
        $user = $this->warehouseStaff();

        $this->actingAs($user)
            ->postJson("/api/categories", [
                "name" => "Nope",
                "slug" => "nope",
            ])
            ->assertForbidden();

        $this->actingAs($user)->getJson("/api/categories")->assertOk();
    }

    // ---- Product: Admin only (2026-08-04 RBAC refinement) ----

    public function test_product_full_crud_as_admin(): void
    {
        $user = $this->admin();
        $category = Category::create([
            "name" => "Thermostats",
            "slug" => "thermostats",
        ]);

        $create = $this->actingAs($user)->postJson("/api/products", [
            "name" => "Smart Thermostat",
            "barcode" => "BC-001",
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "shelf_life_days" => 1,
            "is_active" => true,
            "category_id" => $category->getKey(),
        ]);
        $create->assertCreated();
        $skuId = $create->json("data.id");

        $this->actingAs($user)->getJson("/api/products")->assertOk();
        $this->actingAs($user)
            ->getJson("/api/products/{$skuId}")
            ->assertOk();

        $update = $this->actingAs($user)->putJson("/api/products/{$skuId}", [
            "category_id" => $category->category_id,
        ]);
        $update->assertOk();

        $delete = $this->actingAs($user)->deleteJson("/api/products/{$skuId}");
        $delete->assertNoContent();
    }

    public function test_purchasing_manager_cannot_write_product(): void
    {
        $user = $this->purchasingManager();
        $category = Category::create([
            "name" => "Thermostats",
            "slug" => "thermostats",
        ]);

        $this->actingAs($user)
            ->postJson("/api/products", [
                "name" => "Smart Thermostat",
                "barcode" => "BC-001",
                "unit_of_measure" => "unit",
                "is_seasonal" => false,
                "is_active" => true,
                "category_id" => $category->category_id,
            ])
            ->assertForbidden();

        // Read access is unaffected.
        $this->actingAs($user)->getJson("/api/products")->assertOk();
    }

    public function test_warehouse_staff_cannot_write_product(): void
    {
        $user = $this->warehouseStaff();
        $category = Category::create([
            "name" => "Thermostats",
            "slug" => "thermostats",
        ]);

        $this->actingAs($user)
            ->postJson("/api/products", [
                "name" => "Smart Thermostat",
                "barcode" => "BC-001",
                "unit_of_measure" => "unit",
                "is_seasonal" => false,
                "is_active" => true,
                "category_id" => $category->category_id,
            ])
            ->assertForbidden();
    }

    // ---- Lot: Admin + Warehouse Staff (2026-08-04 RBAC refinement) ----
    // A Lot is a physical receipt record (expiry_date, bin_location), so
    // Warehouse Staff owns it now; Purchasing Manager is read-only.

    public function test_lot_full_crud_as_warehouse_staff(): void
    {
        $user = $this->warehouseStaff();
        $category = Category::create([
            "name" => "Filters",
            "slug" => "filters",
        ]);
        $product = Product::create([
            "name" => "Air Filter",
            "barcode" => "BC-002",
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "is_active" => true,
            "category_id" => $category->category_id,
        ]);

        $create = $this->actingAs($user)->postJson("/api/lots", [
            "sku_id" => $product->sku_id,
            "received_date" => now()->toDateTimeString(),
            "expiry_date" => now()->addDays(30)->toDateString(),
            "bin_location" => "A1",
        ]);
        $create->assertCreated();
        $lotId = $create->json("data.lot_id") ?? $create->json("lot_id");

        $this->actingAs($user)->getJson("/api/lots")->assertOk();
        $this->actingAs($user)
            ->getJson("/api/lots/{$lotId}")
            ->assertOk();

        $update = $this->actingAs($user)->putJson("/api/lots/{$lotId}", [
            "bin_location" => "A2",
        ]);
        $update->assertOk();

        $delete = $this->actingAs($user)->deleteJson("/api/lots/{$lotId}");
        $delete->assertNoContent();
    }

    public function test_lot_full_crud_as_admin(): void
    {
        $user = $this->admin();
        $category = Category::create([
            "name" => "Filters",
            "slug" => "filters",
        ]);
        $product = Product::create([
            "name" => "Air Filter",
            "barcode" => "BC-003",
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "is_active" => true,
            "category_id" => $category->category_id,
        ]);

        $create = $this->actingAs($user)->postJson("/api/lots", [
            "sku_id" => $product->sku_id,
            "received_date" => now()->toDateTimeString(),
            "expiry_date" => now()->addDays(30)->toDateString(),
            "bin_location" => "B1",
        ]);
        $create->assertCreated();
    }

    public function test_purchasing_manager_cannot_write_lot(): void
    {
        $user = $this->purchasingManager();
        $category = Category::create([
            "name" => "Filters",
            "slug" => "filters",
        ]);
        $product = Product::create([
            "name" => "Air Filter",
            "barcode" => "BC-004",
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "is_active" => true,
            "category_id" => $category->category_id,
        ]);

        $this->actingAs($user)
            ->postJson("/api/lots", [
                "sku_id" => $product->sku_id,
                "received_date" => now()->toDateTimeString(),
                "expiry_date" => now()->addDays(30)->toDateString(),
                "bin_location" => "A1",
            ])
            ->assertForbidden();

        // Read access is unaffected.
        $this->actingAs($user)->getJson("/api/lots")->assertOk();
    }

    // ---- OQ-8: normal Lot expiry validation ----

    public function test_lot_creation_rejects_an_expiry_date_before_today(): void
    {
        $user = $this->warehouseStaff();
        $category = Category::create([
            "name" => "Expiry Validation",
            "slug" => "expiry-validation",
        ]);
        $product = Product::create([
            "name" => "Expiry Validation Product",
            "barcode" => "BC-OQ8-001",
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "is_active" => true,
            "category_id" => $category->category_id,
        ]);

        $this->actingAs($user)
            ->postJson("/api/lots", [
                "sku_id" => $product->sku_id,
                "received_date" => now()->toDateTimeString(),
                "expiry_date" => now()->subDay()->toDateString(),
                "bin_location" => "C1",
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(["expiry_date"]);
    }

    public function test_lot_update_rejects_an_expiry_date_before_today(): void
    {
        $user = $this->warehouseStaff();
        $category = Category::create([
            "name" => "Expiry Update Validation",
            "slug" => "expiry-update-validation",
        ]);
        $product = Product::create([
            "name" => "Expiry Update Product",
            "barcode" => "BC-OQ8-002",
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "is_active" => true,
            "category_id" => $category->category_id,
        ]);
        $lot = Lot::create([
            "sku_id" => $product->sku_id,
            "received_date" => now()->toDateTimeString(),
            "expiry_date" => now()->addDays(30)->toDateString(),
            "bin_location" => "C2",
        ]);

        $this->actingAs($user)
            ->putJson("/api/lots/{$lot->lot_id}", [
                "expiry_date" => now()->subDay()->toDateString(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(["expiry_date"]);
    }

    public function test_lot_creation_allows_a_nullable_expiry_date(): void
    {
        $user = $this->warehouseStaff();
        $category = Category::create([
            "name" => "Non Expiring Products",
            "slug" => "non-expiring-products",
        ]);
        $product = Product::create([
            "name" => "Non Expiring Product",
            "barcode" => "BC-OQ8-003",
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "is_active" => true,
            "category_id" => $category->category_id,
        ]);

        $this->actingAs($user)
            ->postJson("/api/lots", [
                "sku_id" => $product->sku_id,
                "received_date" => now()->toDateTimeString(),
                "expiry_date" => null,
                "bin_location" => "C3",
            ])
            ->assertCreated();
    }

    // ---- OQ-7: soft-deleted Category assignment policy ----

    public function test_new_product_cannot_reference_a_soft_deleted_category(): void
    {
        $user = $this->admin();
        $category = Category::create([
            "name" => "Archived Categories",
            "slug" => "archived-categories",
        ]);
        $category->delete();

        $this->actingAs($user)
            ->postJson("/api/products", [
                "name" => "Archived Category Product",
                "barcode" => "BC-OQ7-001",
                "unit_of_measure" => "unit",
                "is_seasonal" => false,
                "is_active" => true,
                "category_id" => $category->category_id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(["category_id"]);
    }

    public function test_product_cannot_be_reassigned_to_a_soft_deleted_category(): void
    {
        $user = $this->admin();
        $category = Category::create([
            "name" => "Archived Categories",
            "slug" => "archived-categories",
        ]);
        $product = Product::create([
            "name" => "Existing Product",
            "barcode" => "BC-OQ7-002",
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "is_active" => true,
            "category_id" => $category->category_id,
        ]);
        $category->delete();

        $this->actingAs($user)
            ->putJson("/api/products/{$product->sku_id}", [
                "category_id" => $category->category_id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(["category_id"]);
    }

    public function test_existing_product_still_loads_its_soft_deleted_category(): void
    {
        $user = $this->admin();
        $category = Category::create([
            "name" => "Archived Categories",
            "slug" => "archived-categories",
        ]);
        $product = Product::create([
            "name" => "Historical Product",
            "barcode" => "BC-OQ7-003",
            "unit_of_measure" => "unit",
            "is_seasonal" => false,
            "is_active" => true,
            "category_id" => $category->category_id,
        ]);
        $category->delete();

        $this->actingAs($user)
            ->getJson("/api/products/{$product->sku_id}")
            ->assertOk()
            ->assertJsonPath("data.category.id", $category->category_id)
            ->assertJsonPath("data.category.name", "Archived Categories");
    }

    public function test_admin_must_restore_category_before_reusing_it(): void
    {
        $user = $this->admin();
        $category = Category::create([
            "name" => "Restorable Categories",
            "slug" => "restorable-categories",
        ]);
        $category->delete();

        $this->actingAs($user)
            ->postJson("/api/categories/{$category->category_id}/restore")
            ->assertOk()
            ->assertJsonPath("data.id", $category->category_id)
            ->assertJsonPath("data.name", "Restorable Categories");

        $this->assertDatabaseHas("categories", [
            "category_id" => $category->category_id,
            "deleted_at" => null,
        ]);

        $this->actingAs($user)
            ->postJson("/api/products", [
                "name" => "Restored Category Product",
                "barcode" => "BC-OQ7-004",
                "unit_of_measure" => "unit",
                "is_seasonal" => false,
                "is_active" => true,
                "category_id" => $category->category_id,
            ])
            ->assertCreated();
    }

    // ---- Cross-cutting ----

    public function test_guest_is_unauthenticated(): void
    {
        $this->getJson("/api/categories")->assertUnauthorized();
    }
}
