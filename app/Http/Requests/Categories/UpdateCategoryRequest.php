<?php

namespace App\Http\Requests\Categories;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var \App\Models\Category $category */
        $category = $this->route("category");

        return $this->user()->can("update", $category);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $category = $this->route("category");

        return [
            "name" => ["sometimes", "string", "max:255"],
            "slug" => [
                "sometimes",
                "string",
                "max:255",
                Rule::unique("categories", "slug")->ignore($category),
            ],
            "description" => ["sometimes", "nullable", "string", "max:255"],
        ];
    }
}
