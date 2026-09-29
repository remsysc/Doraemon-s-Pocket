<?php

declare(strict_types=1);

namespace App\Http\Requests\PurchaseOrders;

use App\Models\PurchaseOrder;
use Illuminate\Foundation\Http\FormRequest;

class IndexPurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', PurchaseOrder::class);
    }

    public function rules(): array
    {
        return [
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
