<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ClassificationController;
use App\Http\Controllers\CycleCountController;
use App\Http\Controllers\InventorySnapshotController;
use App\Http\Controllers\InventoryTransactionController;
use App\Http\Controllers\LotController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReorderConfigController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    Route::get('/user', fn (Request $request) => $request->user());

    // ---- Read Access: Any Authenticated User ----
    Route::apiResource('categories', CategoryController::class)->only([
        'index',
        'show',
    ]);
    Route::apiResource('products', ProductController::class)->only([
        'index',
        'show',
    ]);
    Route::apiResource('lots', LotController::class)->only(['index', 'show']);

    // ---- Write Access: Admin only (catalog/master data) ----
    // Purchasing Manager no longer writes Category/Product as of the 2026-08-04
    // RBAC refinement (PRD §4/§6, SPEC FR-7/FR-11) — catalog structure is
    // Admin-governed; Purchasing Manager works within the existing catalog.
    Route::middleware('role:admin')->group(function () {
        Route::post('categories/{category}/restore', [
            CategoryController::class,
            'restore',
        ]);
        Route::apiResource('categories', CategoryController::class)->except([
            'index',
            'show',
        ]);
        Route::apiResource('products', ProductController::class)->except([
            'index',
            'show',
        ]);
    });

    // ---- Write Access: Warehouse Staff + Admin (physical receipt records) ----
    // A Lot represents a physical stock receipt (expiry_date, bin_location),
    // so it's owned by Warehouse Staff, not Purchasing Manager, as of the
    // 2026-08-04 RBAC refinement (PRD §4/§6, SPEC FR-16).
    Route::middleware('role:admin,warehouse_staff')->group(function () {
        Route::apiResource('lots', LotController::class)->except([
            'index',
            'show',
        ]);
    });

    // ---- Inventory Transactions ----
    // Read (index, show): all authenticated roles — used for analytics and
    // variance analysis by all three roles (SPEC FR-20, §7.x).
    // Write (store): Warehouse Staff + Admin only — append-only ledger of
    // physical stock movements; Purchasing Manager is read-only (SPEC FR-34).
    Route::apiResource(
        'inventory-transactions',
        InventoryTransactionController::class,
    )->only(['index', 'show']);

    // ---- Inventory Snapshots ----
    // Read-only derived stock (qty_on_hand/reserved/available) per SKU.
    // All authenticated roles can read; snapshots are never written directly
    // by clients — they are maintained by the transaction-insert path (FR-22).
    Route::apiResource(
        'inventory-snapshots',
        InventorySnapshotController::class,
    )->only(['index', 'show']);

    Route::middleware('role:admin,warehouse_staff')->group(function () {
        Route::apiResource(
            'inventory-transactions',
            InventoryTransactionController::class,
        )->only(['store']);
    });

    // ---- Inventory Classifications (Sprint 4, FR-15) ----
    // ABC/XYZ classification derived from ledger demand. Read: any role.
    Route::get('inventory-classifications', [
        ClassificationController::class,
        'index',
    ]);

    // ---- Reorder Intelligence & Alerts (Sprint 4) ----
    // Purchasing-owned surfaces: Purchasing Manager + Admin only. Warehouse
    // Staff has no access at all (SPEC FR-32, FR-35). Admin passes via the
    // superuser bypass in RoleMiddleware.
    Route::middleware('role:purchasing_manager,admin')->group(function () {
        Route::post('inventory-classifications/recompute', [
            ClassificationController::class,
            'recompute',
        ]);

        Route::get('reorder-configs/{reorder_config}/metrics', [
            ReorderConfigController::class,
            'metrics',
        ]);
        Route::apiResource('reorder-configs', ReorderConfigController::class);

        Route::get('alerts/reorder', [AlertController::class, 'reorder']);
        Route::get('alerts/expiry', [AlertController::class, 'expiry']);
    });

    // ---- Cycle Counts (Sprint 5, FR-30) ----
    // WS and Admin can create counts and view (WS own counts only).
    // Admin can reconcile/dismiss all counts.
    Route::middleware('role:admin,warehouse_staff')->group(function () {
        Route::apiResource('cycle-counts', CycleCountController::class);
        Route::post('cycle-counts/{cycle_count}/reconcile', [CycleCountController::class, 'reconcile']);
        Route::post('cycle-counts/{cycle_count}/dismiss', [CycleCountController::class, 'dismiss']);
    });

    // ---- Reports (Sprint 5, FR-18) ----
    // Admin only: variance and turnover reports
    Route::middleware('role:admin')->group(function () {
        Route::get('reports/variance', [ReportController::class, 'variance']);
        Route::get('reports/turnover', [ReportController::class, 'turnover']);
    });

    // ---- User Management (Sprint 5, FR-19, FR-38) ----
    // Admin only: CRUD + deactivation
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::post('users/{user}/deactivate', [UserController::class, 'deactivate']);
    });

    // ---- Audit Logs ----
    // Read (index, show): Admin only — view all audit logs
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('audit-logs', AuditLogController::class)->only([
            'index',
            'show',
        ]);
    });
});
