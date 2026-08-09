<?php

namespace App\Http\Requests\Lot;

use App\Models\Lot;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        $lot = $this->route("lot");
        return $this->user()->can("update", $lot);
    }

    public function rules(): array
    {
        return [
            "received_date" => ["sometimes", "date"],
            "expiry_date" => [
                "sometimes",
                "nullable",
                "date",
                "after_or_equal:received_date",
                "after_or_equal:today",
            ],
            "bin_location" => ["sometimes", "string", "max:255"],
        ];
    }
}
