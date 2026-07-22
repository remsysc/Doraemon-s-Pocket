<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\LotController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    Route::get('/user', fn (Request $request) => $request->user());

    // ---- Read access: any authenticated role ----
    // Everyone needs to browse the catalog to do their job (picking, ordering, reporting).
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::get('/lots', [LotController::class, 'index']);
    Route::get('/lots/{lot}', [LotController::class, 'show']);

    // ---- Purchasing Manager + Admin: catalog & procurement writes ----
    Route::middleware('role:admin,purchasing_manager')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);

        Route::post('/lots', [LotController::class, 'store']);
        Route::put('/lots/{lot}', [LotController::class, 'update']);
        Route::delete('/lots/{lot}', [LotController::class, 'destroy']);
    });
});
