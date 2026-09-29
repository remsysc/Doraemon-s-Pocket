<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class DataManagementTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_admin_can_export_categories_csv(): void
    {
        Category::factory()->create([
            'name' => 'Kitchen Appliances',
            'slug' => 'kitchen-appliances',
            'description' => 'Kitchen gear',
        ]);

        $response = $this->actingAs($this->admin())
            ->get('/api/data/export/categories');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('category_id,name,slug,description', $response->getContent());
        $this->assertStringContainsString('Kitchen Appliances', $response->getContent());
    }

    public function test_admin_can_import_categories_csv(): void
    {
        $csvContent = "name,slug,description\nSmart Home,smart-home,Smart devices\nFans,fans,Electric fans\n";
        $file = UploadedFile::fake()->createWithContent('categories.csv', $csvContent);

        $response = $this->actingAs($this->admin())
            ->postJson('/api/data/import/categories', [
                'file' => $file,
            ]);

        $response->assertOk()
            ->assertJsonPath('imported_count', 2)
            ->assertJsonPath('updated_count', 0);

        $this->assertDatabaseHas('categories', ['name' => 'Smart Home', 'slug' => 'smart-home']);
        $this->assertDatabaseHas('categories', ['name' => 'Fans', 'slug' => 'fans']);
    }

    public function test_import_categories_updates_existing_category(): void
    {
        $existing = Category::factory()->create([
            'name' => 'Old Name',
            'slug' => 'old-slug',
            'description' => 'Old description',
        ]);

        $csvContent = "category_id,name,slug,description\n{$existing->category_id},Updated Name,old-slug,Updated description\n";
        $file = UploadedFile::fake()->createWithContent('categories_update.csv', $csvContent);

        $response = $this->actingAs($this->admin())
            ->postJson('/api/data/import/categories', [
                'file' => $file,
            ]);

        $response->assertOk()
            ->assertJsonPath('imported_count', 0)
            ->assertJsonPath('updated_count', 1);

        $this->assertDatabaseHas('categories', [
            'category_id' => $existing->category_id,
            'name' => 'Updated Name',
            'description' => 'Updated description',
        ]);
    }

    public function test_admin_can_export_products_csv(): void
    {
        $category = Category::factory()->create(['name' => 'Cooling']);
        Product::factory()->create([
            'category_id' => $category->category_id,
            'name' => 'Stand Fan 16 inch',
            'barcode' => 'SF-16-001',
            'unit_cost' => 1500.00,
            'unit_price' => 2200.00,
        ]);

        $response = $this->actingAs($this->admin())
            ->get('/api/data/export/products');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('sku_id,category_id,category_name,name', $response->getContent());
        $this->assertStringContainsString('Stand Fan 16 inch', $response->getContent());
        $this->assertStringContainsString('SF-16-001', $response->getContent());
    }

    public function test_admin_can_import_products_csv(): void
    {
        $category = Category::factory()->create(['name' => 'Lighting', 'slug' => 'lighting']);

        $csvContent = "category_id,category_name,name,description,barcode,unit_of_measure,is_seasonal,shelf_life_days,is_active,unit_cost,unit_price\n"
            ."{$category->category_id},Lighting,Desk Lamp,LED Desk Lamp,LAMP-001,unit,0,,1,500.00,850.00\n";

        $file = UploadedFile::fake()->createWithContent('products.csv', $csvContent);

        $response = $this->actingAs($this->admin())
            ->postJson('/api/data/import/products', [
                'file' => $file,
            ]);

        $response->assertOk()
            ->assertJsonPath('imported_count', 1)
            ->assertJsonPath('updated_count', 0);

        $this->assertDatabaseHas('products', [
            'name' => 'Desk Lamp',
            'barcode' => 'LAMP-001',
            'unit_cost' => 500.00,
            'unit_price' => 850.00,
        ]);

        $product = Product::where('barcode', 'LAMP-001')->firstOrFail();
        $this->assertDatabaseHas('inventory_snapshots', [
            'sku_id' => $product->sku_id,
            'qty_on_hand' => 0,
        ]);
    }

    public function test_import_products_updates_existing_product(): void
    {
        $category = Category::factory()->create(['name' => 'Audio']);
        $product = Product::factory()->create([
            'category_id' => $category->category_id,
            'name' => 'Bluetooth Speaker',
            'barcode' => 'SPK-999',
            'unit_cost' => 1000.00,
        ]);

        $csvContent = "barcode,name,unit_cost,unit_price\nSPK-999,Bluetooth Speaker V2,1200.00,1800.00\n";
        $file = UploadedFile::fake()->createWithContent('products_update.csv', $csvContent);

        $response = $this->actingAs($this->admin())
            ->postJson('/api/data/import/products', [
                'file' => $file,
            ]);

        $response->assertOk()
            ->assertJsonPath('imported_count', 0)
            ->assertJsonPath('updated_count', 1);

        $this->assertDatabaseHas('products', [
            'sku_id' => $product->sku_id,
            'name' => 'Bluetooth Speaker V2',
            'unit_cost' => 1200.00,
            'unit_price' => 1800.00,
        ]);
    }

    public function test_non_admin_cannot_access_data_management(): void
    {
        $pm = $this->pm();
        $ws = $this->ws();

        // Export endpoints
        $this->actingAs($pm)->getJson('/api/data/export/categories')->assertForbidden();
        $this->actingAs($ws)->getJson('/api/data/export/categories')->assertForbidden();
        $this->actingAs($pm)->getJson('/api/data/export/products')->assertForbidden();
        $this->actingAs($ws)->getJson('/api/data/export/products')->assertForbidden();

        // Import endpoints
        $file = UploadedFile::fake()->create('test.csv', 10);
        $this->actingAs($pm)->postJson('/api/data/import/categories', ['file' => $file])->assertForbidden();
        $this->actingAs($ws)->postJson('/api/data/import/categories', ['file' => $file])->assertForbidden();
        $this->actingAs($pm)->postJson('/api/data/import/products', ['file' => $file])->assertForbidden();
        $this->actingAs($ws)->postJson('/api/data/import/products', ['file' => $file])->assertForbidden();
    }
}
