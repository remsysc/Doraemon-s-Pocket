<?php
namespace App\Http\Requests\AuditLogs;

use App\Models\AuditLog;
use Illuminate\Foundation\Http\FormRequest;

class IndexAuditLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can("viewAny", AuditLog::class);
    }

    public function rules(): array
    {
        return [];
    }
}
