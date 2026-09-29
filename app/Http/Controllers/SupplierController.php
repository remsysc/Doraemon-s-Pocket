<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Suppliers\DestroySupplierRequest;
use App\Http\Requests\Suppliers\IndexSupplierRequest;
use App\Http\Requests\Suppliers\ShowSupplierRequest;
use App\Http\Requests\Suppliers\StoreSupplierRequest;
use App\Http\Requests\Suppliers\UpdateSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SupplierController extends Controller
{
    public function index(IndexSupplierRequest $request): AnonymousResourceCollection
    {
        $suppliers = QueryBuilder::for(Supplier::class)
            ->allowedFilters(
                AllowedFilter::partial('name'),
                AllowedFilter::exact('is_active'),
            )
            ->allowedSorts('name', 'lead_time_days', 'created_at')
            ->defaultSort('name')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return SupplierResource::collection($suppliers);
    }

    public function show(ShowSupplierRequest $request, Supplier $supplier): SupplierResource
    {
        return new SupplierResource($supplier);
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $supplier = Supplier::create($request->validated());

        return (new SupplierResource($supplier))->response()->setStatusCode(201);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): SupplierResource
    {
        $supplier->update($request->validated());

        return new SupplierResource($supplier);
    }

    public function destroy(DestroySupplierRequest $request, Supplier $supplier): Response
    {
        $supplier->delete();

        return response()->noContent();
    }
}
