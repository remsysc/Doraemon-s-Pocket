<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;

class PurchaseOrderSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        $pm = User::where('role', 'purchasing_manager')->first();

        // --- Suppliers ---
        $coolTech = Supplier::updateOrCreate(
            ['name' => 'CoolTech Distributors'],
            [
                'contact_name' => 'Maria Santos',
                'contact_email' => 'maria@cooltech.ph',
                'contact_phone' => '+63-2-888-1234',
                'address' => '14 Industrial Ave, Caloocan City, Metro Manila',
                'lead_time_days' => 7,
                'is_active' => true,
            ],
        );

        $filterHub = Supplier::updateOrCreate(
            ['name' => 'FilterHub Supply'],
            [
                'contact_name' => 'Jose Reyes',
                'contact_email' => 'jose@filterhub.ph',
                'contact_phone' => '+63-2-555-9876',
                'address' => '88 Warehouse Blvd, Pasig City, Metro Manila',
                'lead_time_days' => 14,
                'is_active' => true,
            ],
        );

        $climateZone = Supplier::updateOrCreate(
            ['name' => 'ClimateZone Ph'],
            [
                'contact_name' => 'Ana Cruz',
                'contact_email' => 'ana@climatezone.ph',
                'contact_phone' => '+63-32-411-0001',
                'address' => '3 Cebu Business Park, Cebu City',
                'lead_time_days' => 21,
                'is_active' => true,
            ],
        );

        // Fetch two products for demo POs
        $ac = Product::where('name', 'Portable AC 1.0 HP')->first();
        $filter = Product::where('name', 'HEPA Replacement Filter Small')->first();
        $thermostat = Product::where('name', 'Digital Smart Thermostat')->first();

        // --- PO 1: received (historical) ---
        $po1 = PurchaseOrder::updateOrCreate(
            ['po_number' => 'PO-SEED001'],
            [
                'supplier_id' => $coolTech->id,
                'status' => 'received',
                'order_date' => now()->subDays(30)->toDateString(),
                'expected_delivery_date' => now()->subDays(23)->toDateString(),
                'notes' => 'Monthly AC unit restock for peak season.',
                'total_amount' => 45000.00,
                'created_by' => $pm->id,
            ],
        );

        if ($ac) {
            PurchaseOrderItem::updateOrCreate(
                ['po_id' => $po1->id, 'sku_id' => $ac->sku_id],
                [
                    'quantity_ordered' => 10,
                    'quantity_received' => 10,
                    'unit_cost' => 4500.00,
                    'total_cost' => 45000.00,
                ],
            );
        }

        // --- PO 2: ordered (in transit) ---
        $po2 = PurchaseOrder::updateOrCreate(
            ['po_number' => 'PO-SEED002'],
            [
                'supplier_id' => $filterHub->id,
                'status' => 'ordered',
                'order_date' => now()->subDays(5)->toDateString(),
                'expected_delivery_date' => now()->addDays(9)->toDateString(),
                'notes' => 'Filter replenishment before expiry season.',
                'total_amount' => 12000.00,
                'created_by' => $pm->id,
            ],
        );

        if ($filter) {
            PurchaseOrderItem::updateOrCreate(
                ['po_id' => $po2->id, 'sku_id' => $filter->sku_id],
                [
                    'quantity_ordered' => 50,
                    'quantity_received' => 0,
                    'unit_cost' => 240.00,
                    'total_cost' => 12000.00,
                ],
            );
        }

        // --- PO 3: draft (pending approval) ---
        $po3 = PurchaseOrder::updateOrCreate(
            ['po_number' => 'PO-SEED003'],
            [
                'supplier_id' => $climateZone->id,
                'status' => 'draft',
                'order_date' => null,
                'expected_delivery_date' => null,
                'notes' => 'Draft — awaiting budget approval for thermostat reorder.',
                'total_amount' => 28000.00,
                'created_by' => $pm->id,
            ],
        );

        if ($thermostat) {
            PurchaseOrderItem::updateOrCreate(
                ['po_id' => $po3->id, 'sku_id' => $thermostat->sku_id],
                [
                    'quantity_ordered' => 20,
                    'quantity_received' => 0,
                    'unit_cost' => 1400.00,
                    'total_cost' => 28000.00,
                ],
            );
        }
    }
}
