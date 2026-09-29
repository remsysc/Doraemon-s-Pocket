<?php

declare(strict_types=1);

namespace App\Http\Requests\Suppliers;

use App\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Supplier::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:1000'],
            'lead_time_days' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
