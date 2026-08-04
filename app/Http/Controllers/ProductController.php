<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Products\IndexProductRequest;
use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Http\Requests\Products\DestroyProductRequest;
use App\Http\Requests\Products\ShowProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\AllowedInclude;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
{
    public function store(StoreProductRequest $request): ProductResource
    {
        // Store the product using the validated data
        $product = Product::create($request->validated());

        return new ProductResource($product)->additional([
            "message" => "Product created successfully",
        ]);
    }

    public function index(
        IndexProductRequest $request,
    ): AnonymousResourceCollection {
        $products = QueryBuilder::for(Product::class)
            ->allowedIncludes("category")
            ->allowedFilters("name", "description", "category_id", "is_active")
            ->allowedSorts("name", "created_at")
            ->defaultSort("name")
            ->paginate($request->integer("per_page", 15))
            ->withQueryString();
        return ProductResource::collection($products);
    }

    public function show(
        ShowProductRequest $request,
        Product $product,
    ): ProductResource {
        $product->loadMissing("category");
        return new ProductResource($product);
    }

    public function update(
        UpdateProductRequest $request,
        Product $product,
    ): ProductResource {
        $product->update($request->validated());
        return new ProductResource($product)->additional([
            "message" => "Product updated successfully",
        ]);
    }

    /*
     * Deactivates the product
     */
    public function destroy(
        DestroyProductRequest $request,
        Product $product,
    ): Response {
        $product->update(["is_active" => false]);
        return response()->noContent();
    }
}
