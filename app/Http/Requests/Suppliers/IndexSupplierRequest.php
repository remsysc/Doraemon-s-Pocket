<?php

declare(strict_types=1);

namespace App\Http\Requests\Suppliers;

use App\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;

class IndexSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Supplier::class);
    }

    public function rules(): array
    {
        return [
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
