<?php

declare(strict_types=1);

namespace App\Http\Requests\PurchaseOrders;

use Illuminate\Foundation\Http\FormRequest;

class DestroyPurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('delete', $this->route('purchase_order'));
    }

    public function rules(): array
    {
        return [];
    }
}
