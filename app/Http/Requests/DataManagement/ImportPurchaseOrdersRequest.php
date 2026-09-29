<?php

declare(strict_types=1);

namespace App\Http\Requests\DataManagement;

use App\Models\PurchaseOrder;
use Illuminate\Foundation\Http\FormRequest;

class ImportPurchaseOrdersRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;

        return in_array($role, ['admin', 'purchasing_manager'], true) || (bool) $this->user()?->can('create', PurchaseOrder::class);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            'dry_run' => ['nullable', 'boolean'],
        ];
    }
}
