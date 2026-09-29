<?php

declare(strict_types=1);

namespace App\Http\Requests\Suppliers;

use Illuminate\Foundation\Http\FormRequest;

class DestroySupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('delete', $this->route('supplier'));
    }

    public function rules(): array
    {
        return [];
    }
}
