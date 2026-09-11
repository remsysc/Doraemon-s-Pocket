<?php

namespace App\Http\Controllers;

use App\Http\Requests\InventorySnapshot\IndexInventorySnapshotRequest;
use App\Http\Requests\InventorySnapshot\ShowInventorySnapshotRequest;
use App\Http\Resources\InventorySnapshotResource;
use App\Models\InventorySnapshot;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class InventorySnapshotController extends Controller
{
    public function index(
        IndexInventorySnapshotRequest $request,
    ): AnonymousResourceCollection {
        $snapshots = QueryBuilder::for(InventorySnapshot::class)
            ->with("product.category")
            ->allowedIncludes("product", "product.category")
            ->allowedFilters(AllowedFilter::exact("sku_id"))
            ->allowedSorts("qty_on_hand", "qty_reserved", "qty_available", "updated_at")
            ->defaultSort("-updated_at")
            ->paginate($request->integer("per_page", 15))
            ->withQueryString();

        return InventorySnapshotResource::collection($snapshots);
    }

    /**
     * Snapshots are keyed by product SKU (SPEC §4:
     * GET /api/inventory-snapshots/{product}).
     */
    public function show(
        ShowInventorySnapshotRequest $request,
        InventorySnapshot $inventorySnapshot,
    ): InventorySnapshotResource {
        $inventorySnapshot->loadMissing("product.category");

        return new InventorySnapshotResource($inventorySnapshot);
    }
}
