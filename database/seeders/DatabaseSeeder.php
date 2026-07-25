<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ["email" => "admin@test.com"],
            [
                "name" => "Admin User",
                "password" => Hash::make("password"),
                "role" => "admin",
                "email_verified_at" => now(),
            ],
        );

        User::updateOrCreate(
            ["email" => "purchasing@test.com"],
            [
                "name" => "Purchasing Manager",
                "password" => Hash::make("password"),
                "role" => "purchasing_manager",
                "email_verified_at" => now(),
            ],
        );

        User::updateOrCreate(
            ["email" => "warehouse@test.com"],
            [
                "name" => "Warehouse Staff",
                "password" => Hash::make("password"),
                "role" => "warehouse_staff",
                "email_verified_at" => now(),
            ],
        );
    }
}
