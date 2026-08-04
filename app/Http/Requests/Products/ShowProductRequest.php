<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class ShowProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        $product = $this->route("product");
        return $this->user()->can("view", $product);
    }

    public function rules(): array
    {
        return [];
    }
}
