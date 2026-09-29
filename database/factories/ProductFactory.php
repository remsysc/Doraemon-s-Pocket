<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->words(3, true),
            'description' => $this->faker->sentence(),
            'barcode' => $this->faker->ean13(),
            'unit_of_measure' => 'unit',
            'is_seasonal' => false,
            'shelf_life_days' => null,
            'is_active' => true,
            'category_id' => Category::factory(),
            'unit_cost' => $this->faker->randomFloat(2, 100, 5000),
            'unit_price' => $this->faker->randomFloat(2, 200, 8000),
        ];
    }
}
