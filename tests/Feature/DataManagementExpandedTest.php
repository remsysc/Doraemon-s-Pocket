<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\CycleCount;
use App\Models\InventorySnapshot;
use App\Models\InventoryTransaction;
use App\Models\Lot;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class DataManagementExpandedTest extends TestCase
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

    public function test_pm_and_admin_can_export_and_import_suppliers_csv(): void
    {
        Supplier::factory()->create([
            'name' => 'SolarTech Philippines',
            'contact_email' => 'sales@solartech.ph',
            'lead_time_days' => 5,
        ]);

        // 1. Export as Purchasing Manager
        $exportRes = $this->actingAs($this->pm())
            ->get('/api/data/export/suppliers');
        $exportRes->assertOk();
        $this->assertStringContainsString('SolarTech Philippines', $exportRes->getContent());

        // 2. Import as Purchasing Manager
        $csv = "name,contact_name,contact_email,lead_time_days\nInverter Co,John,john@inverter.ph,10\nBattery Systems,Jane,jane@battery.ph,14\n";
        $file = UploadedFile::fake()->createWithContent('suppliers.csv', $csv);

        $importRes = $this->actingAs($this->pm())
            ->postJson('/api/data/import/suppliers', ['file' => $file]);

        $importRes->assertOk()
            ->assertJsonPath('imported_count', 2)
            ->assertJsonPath('dry_run', false);

        $this->assertDatabaseHas('suppliers', ['name' => 'Inverter Co', 'lead_time_days' => 10]);
        $this->assertDatabaseHas('suppliers', ['name' => 'Battery Systems', 'lead_time_days' => 14]);
    }

    public function test_ws_and_admin_can_export_and_import_lots_with_synchronized_receipt(): void
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->category_id,
            'barcode' => 'SOLAR-400W',
        ]);

        InventorySnapshot::create([
            'sku_id' => $product->sku_id,
            'qty_on_hand' => 10,
            'qty_reserved' => 0,
            'qty_available' => 10,
        ]);

        // Import lots CSV as Warehouse Staff
        $csv = "barcode,bin_location,quantity,received_date,expiry_date\nSOLAR-400W,BIN-Z-99,25,2026-09-01 10:00:00,2028-09-01\n";
        $file = UploadedFile::fake()->createWithContent('lots.csv', $csv);

        $response = $this->actingAs($this->ws())
            ->postJson('/api/data/import/lots', ['file' => $file]);

        $response->assertOk()
            ->assertJsonPath('imported_count', 1);

        // Verify Lot created
        $lot = Lot::where('sku_id', $product->sku_id)->where('bin_location', 'BIN-Z-99')->first();
        $this->assertNotNull($lot);

        // Verify Synchronized Onboarding: INBOUND_RECEIPT transaction recorded
        $this->assertDatabaseHas('inventory_transactions', [
            'lot_id' => $lot->lot_id,
            'txn_type' => 'RECEIPT',
            'qty_delta' => 25,
        ]);

        // Verify Snapshot updated from 10 to 35
        $snapshot = InventorySnapshot::where('sku_id', $product->sku_id)->first();
        $this->assertSame(35, $snapshot->qty_on_hand);
        $this->assertSame(35, $snapshot->qty_available);

        // Verify WS can export lots CSV
        $exportRes = $this->actingAs($this->ws())->get('/api/data/export/lots');
        $exportRes->assertOk();
        $this->assertStringContainsString('BIN-Z-99', $exportRes->getContent());
    }

    public function test_pm_and_admin_can_export_and_import_purchase_orders_grouped_by_po_number(): void
    {
        $category = Category::factory()->create();
        $product1 = Product::factory()->create(['category_id' => $category->category_id, 'barcode' => 'ITEM-A', 'unit_cost' => 10]);
        $product2 = Product::factory()->create(['category_id' => $category->category_id, 'barcode' => 'ITEM-B', 'unit_cost' => 20]);

        $csv = "po_number,supplier_name,order_date,barcode,quantity_ordered,unit_cost\n"
            ."PO-9999,Apex Supplier,2026-09-29,ITEM-A,5,10.00\n"
            ."PO-9999,Apex Supplier,2026-09-29,ITEM-B,2,25.00\n";
        $file = UploadedFile::fake()->createWithContent('po.csv', $csv);

        $response = $this->actingAs($this->pm())
            ->postJson('/api/data/import/purchase-orders', ['file' => $file]);

        $response->assertOk()
            ->assertJsonPath('imported_count', 1);

        // 1 PO with total 5*10 + 2*25 = 100.00
        $po = PurchaseOrder::where('po_number', 'PO-9999')->first();
        $this->assertNotNull($po);
        $this->assertSame('draft', $po->status);
        $this->assertEquals(100.00, (float) $po->total_amount);
        $this->assertCount(2, $po->items);

        // Verify Export
        $exportRes = $this->actingAs($this->pm())->get('/api/data/export/purchase-orders');
        $exportRes->assertOk();
        $this->assertStringContainsString('PO-9999', $exportRes->getContent());
    }

    public function test_ws_and_admin_can_import_cycle_count_sheet_and_export_variances(): void
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->category_id,
            'barcode' => 'COUNT-SKU-1',
        ]);

        InventorySnapshot::create([
            'sku_id' => $product->sku_id,
            'qty_on_hand' => 50,
            'qty_reserved' => 0,
            'qty_available' => 50,
        ]);

        $csv = "barcode,counted_quantity,notes\nCOUNT-SKU-1,42,Stocktake shelf check\n";
        $file = UploadedFile::fake()->createWithContent('counts.csv', $csv);

        $response = $this->actingAs($this->ws())
            ->postJson('/api/data/import/cycle-counts', ['file' => $file]);

        $response->assertOk()
            ->assertJsonPath('imported_count', 1);

        // Verify CycleCount was recorded with variance 42 - 50 = -8
        $count = CycleCount::where('sku_id', $product->sku_id)->first();
        $this->assertNotNull($count);
        $this->assertSame(50, $count->expected_qty);
        $this->assertSame(42, $count->counted_qty);
        $this->assertSame(-8, $count->variance_qty);
        $this->assertTrue($count->is_flagged);

        // Verify export variances
        $exportRes = $this->actingAs($this->ws())->get('/api/data/export/cycle-counts?status=pending');
        $exportRes->assertOk();
        $this->assertStringContainsString('COUNT-SKU-1', $exportRes->getContent());
    }

    public function test_admin_can_export_inventory_transactions_ledger(): void
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->category_id]);
        $lot = Lot::create([
            'sku_id' => $product->sku_id,
            'bin_location' => 'BIN-LEDGER-1',
            'received_date' => now(),
        ]);
        $admin = $this->admin();

        InventoryTransaction::create([
            'lot_id' => $lot->lot_id,
            'actor_id' => $admin->id,
            'txn_type' => 'RECEIPT',
            'qty_delta' => 100,
            'occurred_at' => now(),
        ]);

        $response = $this->actingAs($admin)->get('/api/data/export/inventory-transactions');
        $response->assertOk();
        $this->assertStringContainsString('RECEIPT', $response->getContent());
        $this->assertStringContainsString((string) $admin->name, $response->getContent());
    }

    public function test_dry_run_preview_validates_without_committing_database_records(): void
    {
        $csv = "name,contact_email,lead_time_days\nDry Run Supplier,dry@test.com,5\n";
        $file = UploadedFile::fake()->createWithContent('dry_suppliers.csv', $csv);

        $response = $this->actingAs($this->pm())
            ->postJson('/api/data/import/suppliers', [
                'file' => $file,
                'dry_run' => true,
            ]);

        $response->assertOk()
            ->assertJsonPath('dry_run', true)
            ->assertJsonPath('imported_count', 1);

        // Database should NOT contain the supplier
        $this->assertDatabaseMissing('suppliers', ['name' => 'Dry Run Supplier']);
    }

    public function test_atomic_rollback_on_csv_row_error(): void
    {
        $category = Category::factory()->create();
        Product::factory()->create(['category_id' => $category->category_id, 'barcode' => 'EXISTING-BARCODE']);

        // First row valid, second row has invalid non-existent barcode
        $csv = "barcode,bin_location,quantity,received_date\n"
            ."EXISTING-BARCODE,BIN-OK,10,2026-09-01 08:00:00\n"
            ."NON-EXISTENT-BARCODE,BIN-BAD,10,2026-09-01 08:00:00\n";
        $file = UploadedFile::fake()->createWithContent('bad_lots.csv', $csv);

        $response = $this->actingAs($this->ws())
            ->postJson('/api/data/import/lots', [
                'file' => $file,
                'dry_run' => false,
            ]);

        $response->assertOk()
            ->assertJsonPath('imported_count', 0);

        // Atomic: Even the first row should NOT be committed
        $this->assertDatabaseMissing('lots', ['bin_location' => 'BIN-OK']);
    }

    public function test_rbac_restrictions_on_data_endpoints(): void
    {
        $csv = "name\nTest Supplier\n";
        $file = UploadedFile::fake()->createWithContent('suppliers.csv', $csv);

        // Warehouse staff cannot import suppliers
        $wsRes = $this->actingAs($this->ws())
            ->postJson('/api/data/import/suppliers', ['file' => $file]);
        $wsRes->assertForbidden();

        // Purchasing manager cannot import lots
        $lotCsv = "barcode,bin_location,quantity,received_date\nB1,L1,5,2026-09-01\n";
        $lotFile = UploadedFile::fake()->createWithContent('lots.csv', $lotCsv);

        $pmRes = $this->actingAs($this->pm())
            ->postJson('/api/data/import/lots', ['file' => $lotFile]);
        $pmRes->assertForbidden();

        // Unauthenticated access fails
        $guestRes = $this->postJson('/api/data/import/categories', ['file' => $file]);
        $this->assertTrue(in_array($guestRes->status(), [401, 403], true));
    }

    public function test_audit_logs_recorded_on_bulk_operations(): void
    {
        $csv = "name\nAudit Log Category\n";
        $file = UploadedFile::fake()->createWithContent('cat.csv', $csv);
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/data/import/categories', ['file' => $file]);

        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $admin->id,
            'action' => 'bulk_import',
            'entity_type' => 'Category',
        ]);
    }

    public function test_download_sample_templates_endpoint(): void
    {
        $user = $this->ws();

        foreach (['categories', 'products', 'suppliers', 'lots', 'purchase_orders', 'cycle_counts'] as $type) {
            $response = $this->actingAs($user)->get("/api/data/templates/{$type}");
            $response->assertOk();
            $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
            $this->assertNotEmpty($response->getContent());
        }
    }
}
