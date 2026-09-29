<?php

declare(strict_types=1);

namespace App\Http\Requests\PurchaseOrders;

use Illuminate\Foundation\Http\FormRequest;

class ShowPurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('view', $this->route('purchase_order'));
    }

    public function rules(): array
    {
        return [];
    }
}
