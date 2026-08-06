<?php

use App\Models\InventoryTransaction;
use Illuminate\Foundation\Http\FormRequest;

class ShowInventoryTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can("view", InventoryTransaction::class);
    }

    public function rules(): array
    {
        return [];
    }
}
