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

    // ---- Write Access: Purchasing Manager + Admin ----
    Route::middleware("role:admin,purchasing_manager")->group(function () {
        Route::apiResource("categories", CategoryController::class)->except([
            "index",
            "show",
        ]);
        Route::apiResource("products", ProductController::class)->except([
            "index",
            "show",
        ]);
        Route::apiResource("lots", LotController::class)->except([
            "index",
            "show",
        ]);
    });
});
