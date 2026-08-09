<?php

namespace App\Http\Requests\InventoryTransaction;

use App\Models\InventoryTransaction;
use App\Models\Lot;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInventoryTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', InventoryTransaction::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'lot_id'     => ['required', Rule::exists(Lot::class, 'lot_id')],
            'txn_type'   => ['required', 'string', Rule::in(InventoryTransaction::TYPES)],
            'qty_delta'  => ['required', 'integer', 'not_in:0'],
            'occured_at' => ['required', 'date'],
            // actor_id is intentionally excluded — set server-side from
            // auth()->id() in the controller (SPEC FR-20, FR-34).
        ];
    }
}
