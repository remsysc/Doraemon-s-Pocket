<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\InventoryTransactionController;
use App\Http\Controllers\LotController;
use App\Http\Controllers\ProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuditLogController;

Route::post("/register", [RegisteredUserController::class, "store"]);
Route::post("/login", [AuthenticatedSessionController::class, "store"]);
Route::middleware("auth:sanctum")->group(function () {
    Route::post("/logout", [AuthenticatedSessionController::class, "destroy"]);
    Route::get("/user", fn(Request $request) => $request->user());

    // ---- Read Access: Any Authenticated User ----
    Route::apiResource("categories", CategoryController::class)->only([
        "index",
        "show",
    ]);
    Route::apiResource("products", ProductController::class)->only([
        "index",
        "show",
    ]);
    Route::apiResource("lots", LotController::class)->only(["index", "show"]);

    // ---- Write Access: Admin only (catalog/master data) ----
    // Purchasing Manager no longer writes Category/Product as of the 2026-08-04
    // RBAC refinement (PRD §4/§6, SPEC FR-7/FR-11) — catalog structure is
    // Admin-governed; Purchasing Manager works within the existing catalog.
    Route::middleware("role:admin")->group(function () {
        Route::post("categories/{category}/restore", [
            CategoryController::class,
            "restore",
        ]);
        Route::apiResource("categories", CategoryController::class)->except([
            "index",
            "show",
        ]);
        Route::apiResource("products", ProductController::class)->except([
            "index",
            "show",
        ]);
    });

    // ---- Write Access: Warehouse Staff + Admin (physical receipt records) ----
    // A Lot represents a physical stock receipt (expiry_date, bin_location),
    // so it's owned by Warehouse Staff, not Purchasing Manager, as of the
    // 2026-08-04 RBAC refinement (PRD §4/§6, SPEC FR-16).
    Route::middleware("role:admin,warehouse_staff")->group(function () {
        Route::apiResource("lots", LotController::class)->except([
            "index",
            "show",
        ]);
    });

    // ---- Inventory Transactions ----
    // Read (index, show): all authenticated roles — used for analytics and
    // variance analysis by all three roles (SPEC FR-20, §7.x).
    // Write (store): Warehouse Staff + Admin only — append-only ledger of
    // physical stock movements; Purchasing Manager is read-only (SPEC FR-34).
    Route::apiResource(
        "inventory-transactions",
        InventoryTransactionController::class,
    )->only(["index", "show"]);

    Route::middleware("role:admin,warehouse_staff")->group(function () {
        Route::apiResource(
            "inventory-transactions",
            InventoryTransactionController::class,
        )->only(["store"]);
    });

    // ---- Audit Logs ----
    // Read (index, show): Admin only — view all audit logs
    Route::middleware("role:admin")->group(function () {
        Route::apiResource("audit-logs", AuditLogController::class)->only([
            "index",
            "show",
        ]);
    });
});
