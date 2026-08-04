<?php

namespace App\Http\Controllers;

use App\Http\Requests\Categories\DestroyCategoryRequest;
use App\Http\Requests\Categories\IndexCategoryRequest;
use App\Http\Requests\Categories\ShowCategoryRequest;
use App\Http\Requests\Categories\StoreCategoryRequest;
use App\Http\Requests\Categories\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CategoryController extends Controller
{
    /**
     * @return AnonymousResourceCollection
     */
    public function index(
        IndexCategoryRequest $request,
    ): AnonymousResourceCollection {
        $categories = QueryBuilder::for(Category::class)
            ->allowedIncludes("products") // Allows GET /api/categories?include=products
            ->allowedFilters(AllowedFilter::partial("name"))
            ->allowedSorts("name", "created_at")
            ->defaultSort("name")
            ->paginate($request->integer("per_page", 15))
            ->withQueryString();

        return CategoryResource::collection($categories);
    }
    /**
     * @return CategoryResource
     */
    public function show(ShowCategoryRequest $request, Category $category)
    {
        $category->loadMissing("products");

        return new CategoryResource($category);
    }
    /**
     * @return CategoryResource
     */
    public function store(StoreCategoryRequest $request)
    {
        $category = Category::create($request->validated());

        return new CategoryResource($category)->additional([
            "message" => "Category created successfully",
        ]);
    }
    /**
     * @return CategoryResource
     */
    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $category->update($request->validated());

        return new CategoryResource($category)->additional([
            "message" => "Category updated successfully",
        ]);
    }
    /**
     * @return Response
     */
    public function destroy(DestroyCategoryRequest $request, Category $category)
    {
        $category->delete();
        return response()->noContent();
    }
}
