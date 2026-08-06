<?php

use App\Models\InventoryTransaction;
use Illuminate\Foundation\Http\FormRequest;

class IndexInventoryTransanctionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can("viewAny", InventoryTransaction::class);
    }

    public function rules(): array
    {
        return [];
    }
}
