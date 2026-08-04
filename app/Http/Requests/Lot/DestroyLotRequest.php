<?php

namespace App\Http\Requests\Lot;

use Illuminate\Foundation\Http\FormRequest;

class DestroyLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        $lot = $this->route("lot");
        return $this->user()->can("delete", $lot);
    }

    public function rules(): array
    {
        return [];
    }
}
