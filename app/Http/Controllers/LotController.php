<?php

namespace App\Http\Controllers;

use App\Http\Requests\Lot\DestroyLotRequest;
use App\Http\Requests\Lot\IndexLotRequest;
use App\Http\Requests\Lot\ShowLotRequest;
use App\Http\Resources\LotResource;
use App\Models\Lot;
use App\Http\Requests\Lot\StoreLotRequest;
use App\Http\Requests\Lot\UpdateLotRequest;

use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class LotController extends Controller
{
    public function index(IndexLotRequest $request): AnonymousResourceCollection
    {
        $lots = QueryBuilder::for(Lot::class)
            ->with("product")
            ->allowedIncludes("product")
            ->allowedFilters(
                AllowedFilter::exact("sku_id"),
                AllowedFilter::partial("bin_location"),
                AllowedFilter::exact("received_date"),
                AllowedFilter::exact("expiry_date"),
            )
            ->allowedSorts(
                "received_date",
                "expiry_date",
                "bin_location",
                "created_at",
            )
            ->defaultSort("-received_date")
            ->paginate($request->integer("per_page", 15))
            ->withQueryString();

        return LotResource::collection($lots);
    }

    public function show(ShowLotRequest $request, Lot $lot)
    {
        $lot->loadMissing("product");
        return new LotResource($lot);
    }

    public function store(StoreLotRequest $request)
    {
        $lot = Lot::create($request->validated());
        return new LotResource($lot);
    }

    public function update(UpdateLotRequest $request, Lot $lot)
    {
        $lot->update($request->validated());
        return new LotResource($lot)->additional([
            "message" => "Lot updated successfully",
        ]);
    }

    public function destroy(DestroyLotRequest $request, Lot $lot): Response
    {
        $lot->delete();
        return response()->noContent();
    }
}
