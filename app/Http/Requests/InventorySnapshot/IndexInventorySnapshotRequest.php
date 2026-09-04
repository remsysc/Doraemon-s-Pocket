<?php

namespace App\Http\Requests\InventorySnapshot;

use App\Models\InventorySnapshot;
use Illuminate\Foundation\Http\FormRequest;

class IndexInventorySnapshotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can("viewAny", InventorySnapshot::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
