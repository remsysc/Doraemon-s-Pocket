<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Lot;
use App\Models\Product;
use App\Services\ReorderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Purchasing alerts (SPEC FR-25, FR-35). Route-guarded to
 * purchasing_manager + admin; Warehouse Staff has no access.
 */
class AlertController extends Controller
{
    /**
     * SKUs whose available stock has fallen to or below their reorder point.
     */
    public function reorder(): JsonResponse
    {
        $service = ReorderService::make();

        $products = Product::query()
            ->with(['category', 'snapshot', 'reorderConfig'])
            ->get();

        $alerts = [];
        foreach ($products as $product) {
            $available = $product->snapshot?->qty_available ?? 0;
            $metrics = $service->metricsFor($product, $product->reorderConfig);
            $reorderPoint = $metrics['reorder_point'];

            if ($available <= $reorderPoint) {
                $alerts[] = [
                    'sku_id' => $product->sku_id,
                    'product' => new ProductResource($product),
                    'qty_available' => $available,
                    'reorder_point' => $reorderPoint,
                    'suggested_order_qty' => $metrics['eoq'],
                    'seasonal' => $metrics['seasonal'],
                ];
            }
        }

        return response()->json(['data' => $alerts]);
    }

    /**
     * Lots expiring within the window (default 30 days) with stock on hand.
     */
    public function expiry(Request $request): JsonResponse
    {
        $windowDays = (int) $request->integer(
            'days',
            (int) config('inventory.expiry_alert_window_days', 30),
        );
        $windowDays = max(1, $windowDays);
        $cutoff = Carbon::now()->addDays($windowDays)->endOfDay();

        $lots = Lot::query()
            ->with('product.category', 'product.snapshot')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', $cutoff)
            ->orderBy('expiry_date')
            ->get();

        $alerts = [];
        foreach ($lots as $lot) {
            $onHand = $lot->product?->snapshot?->qty_on_hand ?? 0;
            if ($onHand <= 0) {
                continue;
            }

            $alerts[] = [
                'lot_id' => $lot->lot_id,
                'sku_id' => $lot->sku_id,
                'product' => new ProductResource($lot->product),
                'expiry_date' => Carbon::parse($lot->expiry_date)->toDateString(),
                'days_to_expiry' => (int) floor(
                    Carbon::now()->startOfDay()->diffInDays(
                        Carbon::parse($lot->expiry_date)->startOfDay(),
                        false,
                    ),
                ),
                'qty_on_hand' => $onHand,
            ];
        }

        return response()->json(['data' => $alerts]);
    }
}
