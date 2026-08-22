<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use LogicException;

class AuditLogService
{
    /**
     * Fields that must never be stored in audit snapshots.
     *
     * @var list<string>
     */
    private const PROTECTED_FIELDS = [
        "password",
        "remember_token",
        "api_token",
        "access_token",
        "refresh_token",
    ];

    public function record(
        string $action,
        Model $model,
        ?array $oldValues,
        ?array $newValues,
    ): AuditLog {
        $actorId = Auth::id();

        if ($actorId === null) {
            throw new LogicException(
                "Cannot create an audit without an authenticated actor",
            );
        }

        return AuditLog::create([
            "actor_id" => $actorId,
            "action" => $action,
            "entity_type" => class_basename($model),
            "entity_id" => (string) $model->getKey(),
            "old_values" => $this->sanitizeValues($oldValues),
            "new_values" => $this->sanitizeValues($newValues),
            "occurred_at" => now(),
        ]);
    }

    /**
     * @param array<string, mixed>|null $values
     * @return array<string, mixed>|null
     */
    private function sanitizeValues(?array $values): ?array
    {
        if ($values === null) {
            return null;
        }

        return array_diff_key($values, array_flip(self::PROTECTED_FIELDS));
    }
}
