<?php

namespace Database\Seeders;

use App\Models\InventoryTransaction;
use App\Models\Lot;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class InventoryTransactionSeeder extends Seeder
{
    /**
     * Seed a repeatable ledger history for the demo catalog.
     */
    public function run(): void
    {
        $actors = User::query()
            ->whereIn('email', ['admin@test.com', 'warehouse@test.com'])
            ->pluck('id', 'email');

        $lots = Lot::query()
            ->with('product')
            ->get()
            ->keyBy(fn (Lot $lot): string => $lot->product->barcode . '|' . $lot->bin_location);

        $transactions = [
            ['id' => '10000000-0000-4000-8000-000000000001', 'barcode' => 'WB-AC-1000', 'bin' => 'AC-A01', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 48, 'days' => 90],
            ['id' => '10000000-0000-4000-8000-000000000002', 'barcode' => 'WB-AC-1000', 'bin' => 'AC-A02', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 36, 'days' => 45],
            ['id' => '10000000-0000-4000-8000-000000000003', 'barcode' => 'WB-AC-1000', 'bin' => 'AC-A01', 'actor' => 'warehouse@test.com', 'type' => 'SALE', 'qty' => -6, 'days' => 12],
            ['id' => '10000000-0000-4000-8000-000000000004', 'barcode' => 'WB-AC-1000', 'bin' => 'AC-A02', 'actor' => 'warehouse@test.com', 'type' => 'RESERVE', 'qty' => -4, 'days' => 8],
            ['id' => '10000000-0000-4000-8000-000000000005', 'barcode' => 'WB-AC-1500', 'bin' => 'AC-B01', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 30, 'days' => 75],
            ['id' => '10000000-0000-4000-8000-000000000006', 'barcode' => 'WB-AC-1500', 'bin' => 'AC-B02', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 24, 'days' => 30],
            ['id' => '10000000-0000-4000-8000-000000000007', 'barcode' => 'WB-AC-1500', 'bin' => 'AC-B01', 'actor' => 'warehouse@test.com', 'type' => 'PICK', 'qty' => -3, 'days' => 6],
            ['id' => '10000000-0000-4000-8000-000000000008', 'barcode' => 'WB-AP-0100', 'bin' => 'AP-A01', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 20, 'days' => 60],
            ['id' => '10000000-0000-4000-8000-000000000009', 'barcode' => 'WB-AP-0100', 'bin' => 'AP-A02', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 16, 'days' => 20],
            ['id' => '10000000-0000-4000-8000-000000000010', 'barcode' => 'WB-AP-0100', 'bin' => 'AP-A01', 'actor' => 'warehouse@test.com', 'type' => 'SALE', 'qty' => -2, 'days' => 5],
            ['id' => '10000000-0000-4000-8000-000000000011', 'barcode' => 'WB-AP-0200', 'bin' => 'AP-B01', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 12, 'days' => 55],
            ['id' => '10000000-0000-4000-8000-000000000012', 'barcode' => 'WB-AP-0200', 'bin' => 'AP-B02', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 10, 'days' => 18],
            ['id' => '10000000-0000-4000-8000-000000000013', 'barcode' => 'WB-AP-0200', 'bin' => 'AP-B01', 'actor' => 'admin@test.com', 'type' => 'WRITE_OFF', 'qty' => -2, 'days' => 4],
            ['id' => '10000000-0000-4000-8000-000000000014', 'barcode' => 'WB-FL-0100', 'bin' => 'FL-A01', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 60, 'days' => 80],
            ['id' => '10000000-0000-4000-8000-000000000015', 'barcode' => 'WB-FL-0100', 'bin' => 'FL-A02', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 45, 'days' => 25],
            ['id' => '10000000-0000-4000-8000-000000000016', 'barcode' => 'WB-FL-0100', 'bin' => 'FL-A01', 'actor' => 'admin@test.com', 'type' => 'ADJUSTMENT', 'qty' => 3, 'days' => 10],
            ['id' => '10000000-0000-4000-8000-000000000017', 'barcode' => 'WB-FL-0200', 'bin' => 'FL-B01', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 50, 'days' => 70],
            ['id' => '10000000-0000-4000-8000-000000000018', 'barcode' => 'WB-FL-0200', 'bin' => 'FL-B02', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 40, 'days' => 15],
            ['id' => '10000000-0000-4000-8000-000000000019', 'barcode' => 'WB-FL-0200', 'bin' => 'FL-B01', 'actor' => 'warehouse@test.com', 'type' => 'SALE', 'qty' => -8, 'days' => 3],
            ['id' => '10000000-0000-4000-8000-000000000020', 'barcode' => 'WB-TH-0100', 'bin' => 'TH-A01', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 18, 'days' => 50],
            ['id' => '10000000-0000-4000-8000-000000000021', 'barcode' => 'WB-TH-0100', 'bin' => 'TH-A02', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 12, 'days' => 12],
            ['id' => '10000000-0000-4000-8000-000000000022', 'barcode' => 'WB-TH-0100', 'bin' => 'TH-A01', 'actor' => 'warehouse@test.com', 'type' => 'PICK', 'qty' => -2, 'days' => 2],
            ['id' => '10000000-0000-4000-8000-000000000023', 'barcode' => 'WB-TH-0200', 'bin' => 'TH-B01', 'actor' => 'warehouse@test.com', 'type' => 'RECEIPT', 'qty' => 14, 'days' => 40],
            ['id' => '10000000-0000-4000-8000-000000000024', 'barcode' => 'WB-TH-0200', 'bin' => 'TH-B02', 'actor' => 'admin@test.com', 'type' => 'WRITE_OFF', 'qty' => -1, 'days' => 1],
        ];

        foreach ($transactions as $transaction) {
            $lot = $lots->get($transaction['barcode'] . '|' . $transaction['bin']);
            $actorId = $actors->get($transaction['actor']);

            if ($lot === null || $actorId === null) {
                throw new RuntimeException('Inventory demo seed references missing catalog or actor data.');
            }

            InventoryTransaction::updateOrCreate(
                ['txn_id' => $transaction['id']],
                [
                    'lot_id' => $lot->lot_id,
                    'actor_id' => $actorId,
                    'txn_type' => $transaction['type'],
                    'qty_delta' => $transaction['qty'],
                    'occured_at' => now()->subDays($transaction['days']),
                ],
            );
        }
    }
}
