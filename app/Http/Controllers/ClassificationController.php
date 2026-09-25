<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Services\ClassificationService;
use Illuminate\Http\JsonResponse;

class ClassificationController extends Controller
{
    /**
     * ABC/XYZ classification for all catalog SKUs (SPEC FR-15).
     * Readable by any authenticated role.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->payload(),
        ]);
    }

    /**
     * Recompute endpoint (admin + purchasing_manager). Classifications are
     * derived live, so this returns the same freshly computed payload.
     */
    public function recompute(): JsonResponse
    {
        return response()->json([
            'data' => $this->payload(),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function payload(): array
    {
        return ClassificationService::make()
            ->classifyAll()
            ->map(fn (array $row): array => [
                'sku_id' => $row['sku_id'],
                'product' => new ProductResource($row['product']),
                'abc' => $row['abc'],
                'xyz' => $row['xyz'],
                'annual_demand' => $row['annual_demand'],
                'annual_value' => $row['annual_value'],
                'cv' => $row['cv'],
            ])
            ->all();
    }
}
