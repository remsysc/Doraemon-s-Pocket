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

    public function test_category_full_crud_as_purchasing_manager(): void
    {
        $user = $this->purchasingManager();

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

    public function test_product_full_crud_as_purchasing_manager(): void
    {
        $user = $this->purchasingManager();
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
            "category_id" => $category->id,
        ]);
        $create->assertCreated();
        $skuId = $create->json("data.id");

        $this->actingAs($user)->getJson("/api/products")->assertOk();
        $this->actingAs($user)
            ->getJson("/api/products/{$skuId}")
            ->assertOk();

        $update = $this->actingAs($user)->putJson("/api/products/{$skuId}", [
            "category_id" => $category->id,
        ]);
        $update->assertOk();

        $delete = $this->actingAs($user)->deleteJson("/api/products/{$skuId}");
        $delete->assertNoContent();
    }

    public function test_lot_full_crud_as_purchasing_manager(): void
    {
        $user = $this->purchasingManager();
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
            "category_id" => $category->id,
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

    public function test_warehouse_staff_can_read_but_not_write(): void
    {
        $user = User::factory()->warehouseStaff()->create();

        $this->actingAs($user)->getJson("/api/categories")->assertOk();

        $this->actingAs($user)
            ->postJson("/api/categories", [
                "name" => "Nope",
                "slug" => "nope",
            ])
            ->assertForbidden();
    }

    public function test_guest_is_unauthenticated(): void
    {
        $this->getJson("/api/categories")->assertUnauthorized();
    }

    public function test_admin_full_crud_on_category(): void
    {
        $user = $this->admin();

        $create = $this->actingAs($user)->postJson("/api/categories", [
            "name" => "Purifiers",
            "slug" => "purifiers",
        ]);
        $create->assertCreated();
        $categoryId = $create->json("data.id");

        $this->actingAs($user)
            ->deleteJson("/api/categories/{$categoryId}")
            ->assertNoContent();
    }
}
