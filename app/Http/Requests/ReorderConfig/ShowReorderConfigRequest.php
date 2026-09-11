<?php

namespace App\Http\Requests\ReorderConfig;

use App\Models\ReorderConfig;
use Illuminate\Foundation\Http\FormRequest;

class ShowReorderConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', ReorderConfig::class);
    }

    public function rules(): array
    {
        return [];
    }
}
