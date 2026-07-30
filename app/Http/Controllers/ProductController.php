<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\DestroyProductRequest;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function store(StoreProductRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Store the product using the validated data
        $product = Product::create($validated);

        return response()->json([
            "message" => "Product created successfully",
            "product" => $product,
        ]);
    }

    //gets all the product, not paginated yet
    // TODO: CREATE A PAGINATION
    public function index(): JsonResponse
    {
        $products = Product::with("category")->get();

        return response()->json([
            "products" => $products,
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $validated = $request->validated();
        $product->update($validated);
        return response()->json([
            "message" => "Product updated successfully",
            "product" => $product,
        ]);
    }

    /*
     * Deactivates the product
     */
    public function destroy(Product $product)
    {
        $product->update(["is_active" => false]);
        return response()->noContent();
    }
}
