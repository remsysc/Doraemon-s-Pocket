<?php

namespace App\Http\Requests\Products;

use App\Models\Category;
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
        $product = $this->route('product');

        // Authorizes against ProductPolicy::update($user, $product)
        return $this->user()->can('update', $product);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        /** @var Product $product */
        $product = $this->route('product');

        return [
            'category_id' => [
                'sometimes',
                'uuid',
                Rule::exists(Category::class, 'category_id')->withoutTrashed(),
            ],
            'name' => [
                'sometimes',
                'string',
                'max:255',
                // Ignore the current product's ID so unique validation passes when keeping the name
                Rule::unique('products', 'name')->ignore(
                    $product?->getKey(),
                    'sku_id',
                ),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'barcode' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'barcode')->ignore(
                    $product?->getKey(),
                    'sku_id',
                ),
            ],
            'unit_of_measure' => ['sometimes', 'string', 'max:255'],
            'is_seasonal' => ['sometimes', 'boolean'],
            'shelf_life_days' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
            ],
            'is_active' => ['sometimes', 'boolean'],
            'unit_cost' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'unit_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * Prepare inputs for validation (Casting types if necessary).
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('is_active') && $this->input('is_active') !== null) {
            $this->merge([
                'is_active' => filter_var(
                    $this->input('is_active'),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE,
                ),
            ]);
        }

        if ($this->has('is_seasonal') && $this->input('is_seasonal') !== null) {
            $this->merge([
                'is_seasonal' => filter_var(
                    $this->input('is_seasonal'),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE,
                ),
            ]);
        }

        if ($this->input('barcode') === '') {
            $this->merge(['barcode' => null]);
        }

        if ($this->input('description') === '') {
            $this->merge(['description' => null]);
        }

        if ($this->input('unit_cost') === '') {
            $this->merge(['unit_cost' => null]);
        }

        if ($this->input('unit_price') === '') {
            $this->merge(['unit_price' => null]);
        }

        if ($this->input('shelf_life_days') === '') {
            $this->merge(['shelf_life_days' => null]);
        }
    }
}
