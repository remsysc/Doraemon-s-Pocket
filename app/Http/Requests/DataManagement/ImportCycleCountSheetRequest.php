<?php

declare(strict_types=1);

namespace App\Http\Requests\DataManagement;

use Illuminate\Foundation\Http\FormRequest;

class ImportCycleCountSheetRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;

        return in_array($role, ['admin', 'warehouse_staff'], true);
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
