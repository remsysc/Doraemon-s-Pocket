<?php

namespace App\Http\Requests\Lot;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Lot;

class StoreLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can("create", Lot::class);
    }

    public function rules(): array
    {
        return [
            // Foreign key: must exist in the products table under sku_id
            "sku_id" => ["required", "uuid", "exists:products,sku_id"],

            // Required date-time string for when the lot was received
            "received_date" => ["required", "date"],

            // Optional date for expiration
            "expiry_date" => [
                "nullable",
                "date",
                "after_or_equal:received_date",
                "after_or_equal:today",
            ],

            // Required string representation of the warehouse location
            "bin_location" => ["required", "string", "max:255"],
        ];
    }
}
