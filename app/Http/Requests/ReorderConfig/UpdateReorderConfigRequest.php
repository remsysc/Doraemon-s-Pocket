<?php

namespace App\Http\Requests\ReorderConfig;

use App\Models\ReorderConfig;
use Illuminate\Foundation\Http\FormRequest;

class UpdateReorderConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        $config = $this->route('reorder_config');

        return $config instanceof ReorderConfig
            ? $this->user()->can('update', $config)
            : $this->user()->can('create', ReorderConfig::class);
    }

    public function rules(): array
    {
        return [
            'reorder_point' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'safety_stock' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'lead_time_days' => ['sometimes', 'integer', 'min:0'],
            'order_cost' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'holding_cost_per_unit' => ['sometimes', 'nullable', 'numeric', 'gt:0'],
            'service_level_z' => ['sometimes', 'numeric', 'gt:0', 'max:10'],
        ];
    }
}
