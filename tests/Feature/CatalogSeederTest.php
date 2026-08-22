<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Lot;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_the_complete_demo_catalog(): void
    {
        $this->seed();

        $this->assertDatabaseCount('categories', 4);
        $this->assertDatabaseCount('products', 8);
        $this->assertDatabaseCount('lots', 16);
        $this->assertSame(4, Category::query()->count());
        $this->assertSame(8, Product::query()->count());
        $this->assertSame(16, Lot::query()->count());
        $this->assertDatabaseHas('categories', [
            'slug' => 'air-conditioning-units',
        ]);
        $this->assertDatabaseHas('products', [
            'barcode' => 'WB-AC-1000',
            'is_seasonal' => true,
        ]);
        $this->assertDatabaseHas('lots', [
            'bin_location' => 'FL-A01',
        ]);
    }

    public function test_database_seeder_is_safe_to_run_again(): void
    {
        $this->seed();
        $this->seed();

        $this->assertDatabaseCount('categories', 4);
        $this->assertDatabaseCount('products', 8);
        $this->assertDatabaseCount('lots', 16);
    }

    public function test_database_seeding_does_not_create_audit_logs(): void
    {
        $this->seed();

        $this->assertDatabaseCount('audit_logs', 0);
    }

}
