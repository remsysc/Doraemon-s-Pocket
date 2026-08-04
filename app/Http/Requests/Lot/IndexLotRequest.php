<?php

namespace App\Http\Requests\Lot;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Lot;

class IndexLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can("viewAny", Lot::class);
    }

    public function rules(): array
    {
        return [
            "filter" => ["nullable", "array"],
            "filter.sku_id" => ["nullable", "uuid"],
            "filter.bin_location" => ["nullable", "string"],
            "filter.received_date" => ["nullable", "date"],
            "filter.expiry_date" => ["nullable", "date"],
            "sort" => ["nullable", "string"],
            "include" => ["nullable", "string"],
            "per_page" => ["nullable", "integer", "min:1", "max:100"],
        ];
    }
}
