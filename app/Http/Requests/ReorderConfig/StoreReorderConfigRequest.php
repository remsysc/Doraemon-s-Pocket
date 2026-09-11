<?php

namespace App\Http\Requests\ReorderConfig;

use App\Models\ReorderConfig;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReorderConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', ReorderConfig::class);
    }

    public function rules(): array
    {
        return [
            'sku_id' => [
                'required',
                'uuid',
                Rule::exists('products', 'sku_id'),
                Rule::unique('reorder_configs', 'sku_id'),
            ],
            'reorder_point' => ['nullable', 'integer', 'min:0'],
            'safety_stock' => ['nullable', 'integer', 'min:0'],
            'lead_time_days' => ['required', 'integer', 'min:0'],
            'order_cost' => ['nullable', 'numeric', 'min:0'],
            'holding_cost_per_unit' => ['nullable', 'numeric', 'gt:0'],
            'service_level_z' => ['sometimes', 'numeric', 'gt:0', 'max:10'],
        ];
    }
}
