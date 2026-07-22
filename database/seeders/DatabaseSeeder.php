<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        User::factory()->admin()->create(['name' => 'Admin User', 'email' =>  'admin@test.com']);
        User::factory()->purchasingManager()->create([
        'name' => 'Purchasing Manager', 'email' => 'purchasing@test.com'
        ]);
        User::factory()->warehouseStaff()->create([
        'name' => 'Warehouse Staff', 'email' => 'warehouse@test.com'
        ]);
    }
}
