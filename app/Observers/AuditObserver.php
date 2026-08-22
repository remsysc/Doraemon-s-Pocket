<?php

namespace App\Observers;

use App\Services\AuditLogService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditObserver
{
    public function __construct(
        private readonly AuditLogService $auditLogService,
    ) {
    }

    public function created(Model $model): void
    {
        if (! Auth::check()) {
            return;
        }

        $this->auditLogService->record(
            action: "CREATE_" . strtoupper(class_basename($model)),
            model: $model,
            oldValues: null,
            newValues: $model->getAttributes(),
        );
    }

    public function updated(Model $model): void
    {
        if (! Auth::check()) {
            return;
        }

        $changes = $model->getChanges();

        if ($changes === []) {
            return;
        }

        $this->auditLogService->record(
            action: "UPDATE_" . strtoupper(class_basename($model)),
            model: $model,
            oldValues: array_intersect_key(
                $model->getPrevious(),
                $changes,
            ),
            newValues: $changes,
        );
    }

    public function deleted(Model $model): void
    {
        if (! Auth::check()) {
            return;
        }

        $this->auditLogService->record(
            action: "DELETE_" . strtoupper(class_basename($model)),
            model: $model,
            oldValues: $model->getAttributes(),
            newValues: null,
        );
    }

    public function restored(Model $model): void
    {
        if (! Auth::check()) {
            return;
        }

        $this->auditLogService->record(
            action: "RESTORE_" . strtoupper(class_basename($model)),
            model: $model,
            oldValues: $model->getPrevious(),
            newValues: $model->getAttributes(),
        );
    }
}
