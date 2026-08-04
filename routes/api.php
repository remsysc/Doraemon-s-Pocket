<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\LotController;
use App\Http\Controllers\ProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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
});
