<?php

declare(strict_types=1);

namespace App\Http\Requests\PurchaseOrders;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('purchase_order'));
    }

    public function rules(): array
    {
        return [
            'supplier_id' => ['sometimes', 'uuid', 'exists:suppliers,id'],
            'status' => [
                'sometimes',
                Rule::in(['draft', 'ordered', 'received']),
            ],
            'order_date' => ['nullable', 'date'],
            'expected_delivery_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
