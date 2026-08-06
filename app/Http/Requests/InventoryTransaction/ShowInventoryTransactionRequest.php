<?php

namespace App\Http\Requests\InventoryTransaction;

use App\Models\InventoryTransaction;
use Illuminate\Foundation\Http\FormRequest;

class ShowInventoryTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $transaction = $this->route('inventoryTransaction');

        // If route-model binding resolved the model, check the instance-level
        // policy. Otherwise fall back to viewAny so unauthenticated/wrong-role
        // requests still get 401/403 correctly.
        if ($transaction instanceof \App\Models\InventoryTransaction) {
            return $this->user()->can('view', $transaction);
        }

        return $this->user()->can('viewAny', \App\Models\InventoryTransaction::class);
    }

    public function rules(): array
    {
        return [];
    }
}
