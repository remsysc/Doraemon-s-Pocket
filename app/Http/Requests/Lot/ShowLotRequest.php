<?php

namespace App\Http\Requests\Lot;
use Illuminate\Foundation\Http\FormRequest;

class ShowLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        $lot = $this->route("lot");
        return $this->user()->can("view", $lot);
    }

    public function rules(): array
    {
        return [];
    }
}
