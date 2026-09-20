<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use App\Models\CycleCount;
use App\Models\InventorySnapshot;
use App\Models\InventoryTransaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Get variance report aggregating discrepancies across SKUs and categories.
     *
     * @param  array{flagged_only?: bool, category_id?: string}  $filters
     */
    public function getVarianceReport(array $filters = []): array
    {
        $threshold = (float) Config::get('inventory.variance_alert_threshold_percentage', 5.0);

        $query = CycleCount::query()
            ->with(['product.category'])
            ->where('status', 'reconciled');

        if (! empty($filters['flagged_only']) && $filters['flagged_only'] === 'true') {
            $query->where('is_flagged', true);
        }

        if (! empty($filters['category_id'])) {
            $query->whereHas('product', fn ($q) => $q->where('category_id', $filters['category_id']));
        }

        $counts = $query->get();

        // Aggregate by SKU
        $skuAggregates = collect();

        foreach ($counts as $count) {
            $skuId = $count->sku_id;
            if (! $skuAggregates->has($skuId)) {
                $skuAggregates->put($skuId, [
                    'sku_id' => $skuId,
                    'product_name' => $count->product?->name ?? '',
                    'category_id' => $count->product?->category_id ?? null,
                    'category_name' => $count->product?->category?->name ?? '',
                    'current_qty_on_hand' => 0,
                    'total_counts' => 0,
                    'net_variance_qty' => 0,
                    'flagged_discrepancy_count' => 0,
                    'last_counted_at' => null,
                ]);
            }

            $skuAggregates->put($skuId, [
                'sku_id' => $skuId,
                'product_name' => $count->product?->name ?? '',
                'category_id' => $count->product?->category_id ?? null,
                'category_name' => $count->product?->category?->name ?? '',
                'current_qty_on_hand' => $this->getCurrentQtyOnHand($skuId),
                'total_counts' => $skuAggregates->get($skuId)['total_counts'] + 1,
                'net_variance_qty' => $skuAggregates->get($skuId)['net_variance_qty'] + $count->variance_qty,
                'flagged_discrepancy_count' => $skuAggregates->get($skuId)['flagged_discrepancy_count'] + ($count->is_flagged ? 1 : 0),
                'last_counted_at' => $count->counted_at->toIso8601String(),
            ]);
        }

        // Calculate threshold and net shrinkage
        $totalDiscrepancies = $counts->where('is_flagged', true)->count();
        $netShrinkage = $counts->sum('variance_qty');

        return [
            'data' => $skuAggregates->values()->toArray(),
            'meta' => [
                'threshold_percentage' => $threshold,
                'total_audited_skus' => $skuAggregates->count(),
                'total_discrepancies' => $totalDiscrepancies,
                'net_shrinkage_units' => $netShrinkage,
            ],
        ];
    }

    /**
     * Get inventory turnover report by category.
     *
     * @param  array{window_days?: int}  $params
     */
    public function getTurnoverReport(array $params = []): array
    {
        $windowDays = (int) ($params['window_days'] ?? Config::get('inventory.turnover_window_days', 90));

        $since = Carbon::now()->subDays($windowDays)->startOfDay();

        // Get categories with their products and snapshot data
        $categories = Category::query()
            ->with(['products' => fn ($q) => $q->with('snapshot')])
            ->get();

        $data = [];

        foreach ($categories as $category) {
            $productCount = $category->products->count();

            if ($productCount === 0) {
                continue;
            }

            // Calculate outflow (SALE + PICK absolute qty_delta)
            $outflowUnits = InventoryTransaction::query()
                ->whereHas('lot', fn ($q) => $q->whereHas('product', fn ($q2) => $q2->where('category_id', $category->category_id)))
                ->whereIn('txn_type', ['SALE', 'PICK'])
                ->where('occurred_at', '>=', $since)
                ->sum(DB::raw('ABS(qty_delta)'));

            // Calculate average on-hand across category SKUs
            $avgOnHand = 0.0;
            $snapshotCount = 0;

            foreach ($category->products as $product) {
                if ($product->snapshot) {
                    $avgOnHand += $product->snapshot->qty_on_hand;
                    $snapshotCount++;
                }
            }

            $avgOnHand = $snapshotCount > 0 ? $avgOnHand / $snapshotCount : 0.0;

            // Calculate turnover ratio
            $turnoverRatio = $avgOnHand > 0 ? round($outflowUnits / $avgOnHand, 2) : 0.0;

            // Determine velocity tier
            $velocityTier = $this->getVelocityTier($turnoverRatio);

            $data[] = [
                'category_id' => $category->category_id,
                'category_name' => $category->name,
                'product_count' => $productCount,
                'outflow_units' => $outflowUnits,
                'avg_on_hand' => round($avgOnHand, 2),
                'turnover_ratio' => $turnoverRatio,
                'velocity_tier' => $velocityTier,
            ];
        }

        return [
            'data' => $data,
            'meta' => [
                'window_days' => $windowDays,
                'generated_at' => now()->toIso8601String(),
            ],
        ];
    }

    /**
     * Get current qty_on_hand for a SKU.
     */
    private function getCurrentQtyOnHand(string $skuId): int
    {
        $snapshot = InventorySnapshot::query()->where('sku_id', $skuId)->first();

        return $snapshot?->qty_on_hand ?? 0;
    }

    /**
     * Determine velocity tier based on turnover ratio.
     */
    private function getVelocityTier(float $ratio): string
    {
        if ($ratio >= 3.0) {
            return 'High';
        }
        if ($ratio >= 1.0) {
            return 'Medium';
        }
        if ($ratio > 0.0) {
            return 'Low';
        }

        return 'Dead Stock';
    }
}
