<?php

namespace App\Http\Requests\Categories;

use App\Models\Category;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can("viewAny", Category::class);
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
            "per_page" => ["sometimes", "integer", "min:1", "max:100"],
            "page" => ["sometimes", "integer", "min:1"],

            // 2. Filter Validation (Matches allowedFilters in QueryBuilder)
            "filter" => ["sometimes", "array"],
            "filter.name" => ["sometimes", "string", "max:255"],
            "filter.description" => ["sometimes", "string", "max:255"],
            "filter.is_active" => ["sometimes", "boolean"],

            // 3. Sorting Rules (Matches allowedSorts in QueryBuilder)
            "sort" => [
                "sometimes",
                "string",
                Rule::in(["name", "-name", "created_at", "-created_at"]),
            ],

            // 4. Includes Rules (Matches allowedIncludes in QueryBuilder)
            "include" => ["sometimes", "string", Rule::in(["products"])],
        ];
    }

    /**
     * Prepare inputs for validation.
     */
    protected function prepareForValidation(): void
    {
        // Converts "true"/"false" query string parameters into actual booleans
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
