<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Bootstrap data is installation state, not a human-authored change.
        Model::withoutEvents(function (): void {
            User::updateOrCreate(
                ["email" => "admin@test.com"],
                [
                    "name" => "Admin User",
                    "password" => "password",
                    "role" => "admin",
                    "email_verified_at" => now(),
                ],
            );

            User::updateOrCreate(
                ["email" => "purchasing@test.com"],
                [
                    "name" => "Purchasing Manager",
                    "password" => "password",
                    "role" => "purchasing_manager",
                    "email_verified_at" => now(),
                ],
            );

            User::updateOrCreate(
                ["email" => "warehouse@test.com"],
                [
                    "name" => "Warehouse Staff",
                    "password" => "password",
                    "role" => "warehouse_staff",
                    "email_verified_at" => now(),
                ],
            );

            $this->call([
                CatalogSeeder::class,
                InventoryTransactionSeeder::class,
            ]);
        });
    }
}
