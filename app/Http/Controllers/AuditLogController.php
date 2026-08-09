<?php

namespace App\Http\Controllers;

use App\Http\Requests\AuditLogs\IndexAuditLogRequest;
use App\Http\Requests\AuditLogs\ShowAuditLogRequest;
use App\Models\AuditLog;
use App\Http\Resources\AuditLogResource;

class AuditLogController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexAuditLogRequest $request)
    {
        $auditLogs = AuditLog::query()
            ->with("actor")
            ->latest("occurred_at")
            ->paginate($request->integer("per_page", 10))
            ->withQueryString();
        return AuditLogResource::collection($auditLogs);
    }

    /**
     * Display the specified resource.
     */
    public function show(ShowAuditLogRequest $request, AuditLog $auditLog)
    {
        $auditLog->loadMissing("actor");
        return new AuditLogResource($auditLog);
    }
}
