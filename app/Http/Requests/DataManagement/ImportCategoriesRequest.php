<?php

declare(strict_types=1);

namespace App\Http\Requests\DataManagement;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

class ImportCategoriesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin' || (bool) $this->user()?->can('create', Category::class);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ];
    }
}
