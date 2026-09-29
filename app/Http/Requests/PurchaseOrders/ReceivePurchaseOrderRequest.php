<?php

declare(strict_types=1);

namespace App\Http\Requests\PurchaseOrders;

use Illuminate\Foundation\Http\FormRequest;

class ReceivePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('receive', $this->route('purchase_order'));
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.sku_id' => ['required', 'uuid', 'exists:products,sku_id'],
            'items.*.qty_received' => ['required', 'integer', 'min:1'],
            // Optional: attach receipt to an existing lot, or a new lot will be created by the caller
            'items.*.lot_id' => ['nullable', 'uuid', 'exists:lots,lot_id'],
        ];
    }
}
