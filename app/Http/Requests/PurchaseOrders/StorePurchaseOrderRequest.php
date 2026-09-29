<?php

declare(strict_types=1);

namespace App\Http\Requests\PurchaseOrders;

use App\Models\PurchaseOrder;
use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', PurchaseOrder::class);
    }

    public function rules(): array
    {
        return [
            'supplier_id' => ['required', 'uuid', 'exists:suppliers,id'],
            'order_date' => ['nullable', 'date'],
            'expected_delivery_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.sku_id' => ['required', 'uuid', 'exists:products,sku_id'],
            'items.*.quantity_ordered' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
