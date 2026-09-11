<?php

namespace App\Http\Requests\ReorderConfig;

use App\Models\ReorderConfig;
use Illuminate\Foundation\Http\FormRequest;

class IndexReorderConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', ReorderConfig::class);
    }

    public function rules(): array
    {
        return [
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
