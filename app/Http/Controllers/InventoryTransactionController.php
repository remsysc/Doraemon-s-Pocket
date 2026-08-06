<?php

namespace App\Http\Controllers;

use App\Http\Requests\InventoryTransaction\IndexInventoryTransanctionRequest;
use App\Http\Requests\InventoryTransaction\ShowInventoryTransactionRequest;
use App\Http\Requests\InventoryTransaction\StoreInventoryTransactionRequest;
use App\Http\Resources\InventoryTransactionResource;
use App\Models\InventoryTransaction;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class InventoryTransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexInventoryTransanctionRequest $request)
    {
        $transactions = QueryBuilder::for(InventoryTransaction::class)
            ->with('lot.product', 'actor')
            ->allowedIncludes('lot', 'lot.product', 'actor')
            ->allowedFilters(
                AllowedFilter::exact('lot_id'),
                AllowedFilter::exact('txn_type'),
                AllowedFilter::callback(
                    'from_date',
                    fn ($query, $value) => $query->where('occured_at', '>=', $value),
                ),
                AllowedFilter::callback(
                    'to_date',
                    fn ($query, $value) => $query->where('occured_at', '<=', $value),
                ),
            )
            ->allowedSorts('created_at', 'occured_at', 'qty_delta')
            ->defaultSort('-occured_at')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return InventoryTransactionResource::collection($transactions);
    }

    /**
     * Store a newly created resource in storage.
     *
     * actor_id is always set from the authenticated session — never
     * from the request body (SPEC FR-20).
     */
    public function store(StoreInventoryTransactionRequest $request)
    {
        $transaction = InventoryTransaction::create([
            ...$request->validated(),
            'actor_id' => $request->user()->id,
        ]);

        $transaction->load('lot.product', 'actor');

        return (new InventoryTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(
        ShowInventoryTransactionRequest $request,
        InventoryTransaction $inventoryTransaction,
    ) {
        $inventoryTransaction->loadMissing('lot.product', 'actor');

        return new InventoryTransactionResource($inventoryTransaction);
    }
}
