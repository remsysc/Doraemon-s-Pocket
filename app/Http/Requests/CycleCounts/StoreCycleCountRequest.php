<?php

declare(strict_types=1);

namespace App\Http\Requests\CycleCounts;

use App\Models\Lot;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCycleCountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'sku_id' => [
                'required',
                'uuid',
                Rule::exists(Product::class, 'sku_id'),
            ],
            'lot_id' => [
                'nullable',
                'uuid',
                Rule::exists(Lot::class, 'lot_id'),
            ],
            'counted_qty' => [
                'required',
                'integer',
                'min:0',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'sku_id.required' => 'The product SKU ID is required.',
            'sku_id.uuid' => 'The product SKU ID must be a valid UUID.',
            'sku_id.exists' => 'The specified product does not exist.',
            'lot_id.uuid' => 'The lot ID must be a valid UUID.',
            'lot_id.exists' => 'The specified lot does not exist.',
            'counted_qty.required' => 'The counted quantity is required.',
            'counted_qty.integer' => 'The counted quantity must be an integer.',
            'counted_qty.min' => 'The counted quantity must be non-negative.',
            'notes.string' => 'The notes must be a valid string.',
            'notes.max' => 'The notes may not exceed 500 characters.',
        ];
    }
}
