<?php
namespace App\Http\Requests\AuditLogs;

use App\Models\AuditLog;
use Illuminate\Foundation\Http\FormRequest;

class ShowAuditLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can("view", $this->route("audit_log"));
    }

    public function rules(): array
    {
        return [];
    }
}
