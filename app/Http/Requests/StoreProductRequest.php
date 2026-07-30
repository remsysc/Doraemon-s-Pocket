<?php

namespace App\Http\Requests;

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
        return $this->user()->can("create", Product::class); // Only allow authenticated users to make this request
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ["required", "string", "max:255"],
            "description" => ["nullable", "string"],
            "barcode" => [
                "required",
                "string",
                "max:255",
                "unique:products,barcode",
            ],
            "unit_of_measure" => ["required", "string", "max:255"],
            "is_seasonal" => ["required", "boolean"],
            "shelf_life_days" => [
                "required_if:is_seasonal,true",
                "integer",
                "min:1",
            ],
            "is_active" => ["required", "boolean"],
            "category_id" => ["required", Rule::exists(Category::class, "id")],
        ];
    }
}
