<?php

namespace App\Http\Requests\Categories;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

class RestoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $category = Category::withTrashed()->find($this->route("category"));

        return $category !== null && $this->user()->can("restore", $category);
    }

    public function rules(): array
    {
        return [];
    }
}
