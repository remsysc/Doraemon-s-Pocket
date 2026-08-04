<?php

namespace App\Http\Requests\Products;

use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can("viewAny", Product::class); // Only allow authenticated users to make this request
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // 1. Pagination Protection
            // Prevents users from requesting ?per_page=999999 and crashing the DB
            "per_page" => ["sometimes", "integer", "min:1", "max:100"],
            "page" => ["sometimes", "integer", "min:1"],

            // 2. Filter Validation (Matches allowedFilters in QueryBuilder)
            "filter" => ["sometimes", "array"],
            "filter.name" => ["sometimes", "string", "max:255"],
            "filter.description" => ["sometimes", "string", "max:255"],
            "filter.category_id" => [
                "sometimes",
                "uuid",
                "exists:categories,category_id",
            ],
            "filter.is_active" => ["sometimes", "boolean"],

            // 3. Sorting Rules (Matches allowedSorts in QueryBuilder)
            // Allows ascending or descending (-name, -created_at)
            "sort" => [
                "sometimes",
                "string",
                Rule::in(["name", "-name", "created_at", "-created_at"]),
            ],

            // 4. Includes Rules (Matches allowedIncludes in QueryBuilder)
            "include" => ["sometimes", "string", Rule::in(["category"])],
        ];
    }

    /**
     * Prepare inputs for validation (Casting types if necessary).
     */
    protected function prepareForValidation(): void
    {
        // Converts "true"/"false" query string parameters into actual booleans for 'is_active' filter
        if ($this->has("filter.is_active")) {
            $this->merge([
                "filter" => array_merge($this->input("filter", []), [
                    "is_active" => filter_var(
                        $this->input("filter.is_active"),
                        FILTER_VALIDATE_BOOLEAN,
                        FILTER_NULL_ON_FAILURE,
                    ),
                ]),
            ]);
        }
    }
}
