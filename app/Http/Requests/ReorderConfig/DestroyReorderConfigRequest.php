<?php

namespace App\Http\Requests\ReorderConfig;

use App\Models\ReorderConfig;
use Illuminate\Foundation\Http\FormRequest;

class DestroyReorderConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        $config = $this->route('reorder_config');

        return $config instanceof ReorderConfig
            && $this->user()->can('delete', $config);
    }

    public function rules(): array
    {
        return [];
    }
}
