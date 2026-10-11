<?php

namespace App\Http\Requests\Products;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Product::class); // Only allow authenticated users to make this request
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'barcode' => [
                'nullable',
                'string',
                'max:255',
                'unique:products,barcode',
            ],
            'unit_of_measure' => ['required', 'string', 'max:255'],
            'is_seasonal' => ['sometimes', 'boolean'],
            'shelf_life_days' => [
                'required_if:is_seasonal,true',
                'nullable',
                'integer',
                'min:1',
            ],
            'is_active' => ['sometimes', 'boolean'],
            'category_id' => [
                'required',
                Rule::exists(Category::class, 'category_id')->withoutTrashed(),
            ],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * Prepare inputs for validation.
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
        } else {
            $this->merge([
                'is_active' => true,
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
        } else {
            $this->merge([
                'is_seasonal' => false,
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
