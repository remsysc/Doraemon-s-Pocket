<?php

namespace Database\Factories;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuditLog>
 */
class AuditLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            "actor_id" => \App\Models\User::factory(),
            "action" => fake()->randomElement([
                "CREATE_PRODUCT",
                "UPDATE_PRODUCT",
                "CREATE_LOT",
                "UPDATE_LOT",
            ]),
            "entity_type" => fake()->randomElement([
                "Product",
                "Lot",
                "Category",
                "User",
            ]),
            "entity_id" => fake()->uuid(),
            "old_values" => null,
            "new_values" => ["status" => "active"],
            "occurred_at" => now(),
        ];
    }
}
