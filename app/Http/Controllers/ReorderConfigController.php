<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReorderConfig\DestroyReorderConfigRequest;
use App\Http\Requests\ReorderConfig\IndexReorderConfigRequest;
use App\Http\Requests\ReorderConfig\ShowReorderConfigRequest;
use App\Http\Requests\ReorderConfig\StoreReorderConfigRequest;
use App\Http\Requests\ReorderConfig\UpdateReorderConfigRequest;
use App\Http\Resources\ReorderConfigResource;
use App\Models\ReorderConfig;
use App\Services\ReorderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ReorderConfigController extends Controller
{
    public function index(IndexReorderConfigRequest $request): AnonymousResourceCollection
    {
        $configs = QueryBuilder::for(ReorderConfig::class)
            ->with('product.category')
            ->allowedFilters(AllowedFilter::exact('sku_id'))
            ->allowedSorts('lead_time_days', 'reorder_point', 'updated_at')
            ->defaultSort('-updated_at')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return ReorderConfigResource::collection($configs);
    }

    public function store(StoreReorderConfigRequest $request): JsonResponse
    {
        $config = ReorderConfig::create($request->validated());
        $config->load('product.category');

        return (new ReorderConfigResource($config))->response()->setStatusCode(201);
    }

    public function show(
        ShowReorderConfigRequest $request,
        ReorderConfig $reorderConfig,
    ): ReorderConfigResource {
        $reorderConfig->loadMissing('product.category');

        return new ReorderConfigResource($reorderConfig);
    }

    public function update(
        UpdateReorderConfigRequest $request,
        ReorderConfig $reorderConfig,
    ): ReorderConfigResource {
        $reorderConfig->update($request->validated());
        $reorderConfig->load('product.category');

        return new ReorderConfigResource($reorderConfig);
    }

    public function destroy(
        DestroyReorderConfigRequest $request,
        ReorderConfig $reorderConfig,
    ): JsonResponse {
        $reorderConfig->delete();

        return response()->json([], 204);
    }

    /**
     * Derived reorder metrics (ROP, safety stock, EOQ, seasonal basis) for a SKU.
     */
    public function metrics(
        ShowReorderConfigRequest $request,
        ReorderConfig $reorderConfig,
    ): JsonResponse {
        $reorderConfig->loadMissing('product');

        return response()->json([
            'data' => ReorderService::make()->metricsFor(
                $reorderConfig->product,
                $reorderConfig,
            ),
        ]);
    }
}
