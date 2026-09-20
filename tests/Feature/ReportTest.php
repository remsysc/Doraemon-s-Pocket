<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CycleCount;
use App\Models\InventorySnapshot;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_admin_can_get_variance_report(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->getJson('/api/reports/variance');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [],
            'meta' => [
                'threshold_percentage',
                'total_audited_skus',
                'total_discrepancies',
                'net_shrinkage_units',
            ],
        ]);
    }

    public function test_admin_can_get_variance_report_with_filters(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->getJson('/api/reports/variance?flagged_only=true');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [],
            'meta' => [
                'threshold_percentage',
                'total_audited_skus',
                'total_discrepancies',
                'net_shrinkage_units',
            ],
        ]);
    }

    public function test_purchasing_manager_cannot_get_variance_report(): void
    {
        $pm = User::where('email', 'purchasing@test.com')->first();
        $this->actingAs($pm);

        $response = $this->getJson('/api/reports/variance');

        $response->assertStatus(403);
    }

    public function test_guest_cannot_get_variance_report(): void
    {
        $response = $this->getJson('/api/reports/variance');

        $response->assertStatus(401);
    }

    public function test_admin_can_get_turnover_report(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->getJson('/api/reports/turnover');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [],
            'meta' => [
                'window_days',
                'generated_at',
            ],
        ]);
    }

    public function test_admin_can_get_turnover_report_with_custom_window(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->getJson('/api/reports/turnover?window_days=30');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.window_days', 30);
    }

    public function test_purchasing_manager_cannot_get_turnover_report(): void
    {
        $pm = User::where('email', 'purchasing@test.com')->first();
        $this->actingAs($pm);

        $response = $this->getJson('/api/reports/turnover');

        $response->assertStatus(403);
    }

    public function test_guest_cannot_get_turnover_report(): void
    {
        $response = $this->getJson('/api/reports/turnover');

        $response->assertStatus(401);
    }

    public function test_turnover_report_calculates_velocity_tiers(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->getJson('/api/reports/turnover');

        $response->assertStatus(200);

        // Verify velocity tiers are valid values
        foreach ($response->json('data') as $category) {
            $this->assertNotNull($category['velocity_tier']);
            $this->assertContains($category['velocity_tier'], ['High', 'Medium', 'Low', 'Dead Stock']);
        }
    }

    public function test_variance_report_shows_threshold_from_config(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $this->actingAs($admin);

        $response = $this->getJson('/api/reports/variance');

        $response->assertStatus(200);
        $this->assertEquals(5.0, $response->json('meta.threshold_percentage'));
    }

    public function test_variance_report_shows_flagged_discrepancy_count(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $product = Product::first();
        $snapshot = InventorySnapshot::where('sku_id', $product->sku_id)->first();
        $this->actingAs($admin);

        // Create a flagged count (>5% variance)
        CycleCount::create([
            'sku_id' => $product->sku_id,
            'counted_by' => $admin->id,
            'counter_name' => $admin->name,
            'expected_qty' => $snapshot->qty_on_hand,
            'counted_qty' => 0, // 100% variance - flagged
            'variance_qty' => -$snapshot->qty_on_hand,
            'variance_pct' => 100.0,
            'is_flagged' => true,
            'status' => 'reconciled',
            'reconciled_by' => $admin->id,
            'reconciled_at' => now(),
            'counted_at' => now(),
        ]);

        $response = $this->getJson('/api/reports/variance');

        $response->assertStatus(200);
        $data = collect($response->json('data'));
        $productCount = $data->firstWhere('sku_id', $product->sku_id);

        $this->assertNotNull($productCount);
        $this->assertEquals(1, $productCount['flagged_discrepancy_count']);
    }
}
