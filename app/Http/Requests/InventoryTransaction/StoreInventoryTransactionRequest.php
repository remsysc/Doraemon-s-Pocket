<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use App\Models\InventoryTransaction;
use App\Models\Lot;
use Illuminate\Validation\Rule;
use App\Models\User;

class StoreInventoryTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can("create", InventoryTransaction::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "tx_type" => ["required", "string", Rule::in(["in", "out"])], // Tightened enum validation
            "qty_delta" => ["required", "integer"],
            "occured_at" => ["required", "date"],
            "lot_id" => ["required", Rule::exists(Lot::class, "lot_id")],
            "actor_id" => ["required", Rule::exists(User::class, "id")],
        ];
    }
}
