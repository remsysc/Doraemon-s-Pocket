<?php

namespace App\Http\Requests\Products;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var Product $product */
        $product = $this->route("product");

        // Authorizes against ProductPolicy::update($user, $product)
        return $this->user()->can("update", $product);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        /** @var Product $product */
        $product = $this->route("product");

        return [
            "category_id" => [
                "sometimes",
                "uuid",
                "exists:categories,category_id",
            ],
            "name" => [
                "sometimes",
                "string",
                "max:255",
                // Ignore the current product's ID so unique validation passes when keeping the name
                Rule::unique("products", "name")->ignore(
                    $product?->getKey(),
                    "sku_id",
                ),
            ],
            "description" => ["sometimes", "nullable", "string", "max:1000"],
            "price" => ["sometimes", "numeric", "min:0"],
            "is_active" => ["sometimes", "boolean"],
        ];
    }

    /**
     * Prepare inputs for validation (Casting types if necessary).
     */
    protected function prepareForValidation(): void
    {
        if ($this->has("is_active")) {
            $this->merge([
                "is_active" => filter_var(
                    $this->input("is_active"),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE,
                ),
            ]);
        }
    }
}
