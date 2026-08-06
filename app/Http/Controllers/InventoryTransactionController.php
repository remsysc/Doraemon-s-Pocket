<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexInventoryTransactionRequest;
use App\Http\Requests\StoreInventoryTransactionRequest;
use App\Models\InventoryTransaction;
use App\Http\Requests\ShowInventoryTransactionRequest;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use App\Resources\InventoryTransactionResource;

class InventoryTransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexInventoryTransactionRequest $request)
    {
        $inventory_txn = QueryBuilder::for(InventoryTransaction::class)
            ->with("lot.product", "actor")
            ->allowedIncludes("lot", "lot.product", "actor")
            ->allowedFilters(
                AllowedFilter::exact("lot_id"),
                AllowedFilter::exact("user_id"),
                AllowedFilter::exact("txn_type"),
                AllowedFilter::callback(
                    "from_date",
                    fn($query, $value) => $query->where(
                        "occured_at",
                        ">=",
                        $value,
                    ),
                ),
                AllowedFilter::callback(
                    "to_date",
                    fn($query, $value) => $query->where(
                        "occured_at",
                        "<=",
                        $value,
                    ),
                ),
            )
            ->allowedSorts("created_at", "occured_at", "qty_delta")
            ->defaultSort("-occured_at")
            ->paginate($request->input("per_page", 15))
            ->withQueryString();

        return InventoryTransactionResource::collection($inventory_txn);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreInventoryTransactionRequest $request)
    {
        $inventory_txn = InventoryTransaction::create($request->validated());

        return new InventoryTransactionResource($inventory_txn);
    }

    /**
     * Display the specified resource.
     */
    public function show(
        ShowInventoryTransactionRequest $request,
        InventoryTransaction $inventoryTransaction,
    ) {
        $inventoryTransaction->loadMissing("lot.product", "actor");
        return new InventoryTransactionResource($inventoryTransaction);
    }
}
