<?php

declare(strict_types=1);

namespace App\Http\Requests\Suppliers;

use Illuminate\Foundation\Http\FormRequest;

class ShowSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('view', $this->route('supplier'));
    }

    public function rules(): array
    {
        return [];
    }
}
