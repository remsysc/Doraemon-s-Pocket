<?php

namespace App\Services;

use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ReorderConfig;
use Illuminate\Support\Carbon;

/**
 * Reorder intelligence: demand statistics from the append-only ledger, ROP
 * with statistical safety stock, EOQ for non-seasonal items, and a seasonal
 * reorder trigger (SPEC FR-26/FR-27/FR-28/FR-29).
 *
 * Demand is the absolute outflow (SALE + PICK) per SKU over a trailing
 * window. Lead-time variance is not modeled (single-supplier demo), so the
 * FR-27 safety-stock formula reduces to Z * sqrt(lead_time_days * demand_variance).
 */
class ReorderService
{
    /** Outflow transaction types that represent real demand. */
    private const DEMAND_TYPES = ['SALE', 'PICK'];

    public function __construct(
        private readonly int $windowDays = 90,
    ) {}

    public static function make(): self
    {
        return new self((int) config('inventory.reorder_demand_window_days', 90));
    }

    /**
     * Compute the full reorder metric set for a SKU.
     *
     * @return array<string, mixed>
     */
    public function metricsFor(Product $product, ?ReorderConfig $config = null): array
    {
        $config ??= $product->reorderConfig;

        $leadTimeDays = $config?->lead_time_days ?? 0;
        $z = (float) ($config?->service_level_z ?? 1.65);

        $daily = $this->dailyDemandSeries($product->sku_id);
        $avgDailyDemand = $this->mean($daily);
        $demandVariance = $this->variance($daily);
        $annualDemand = $avgDailyDemand * 365;

        $derivedSafetyStock = (int) round(
            $z * sqrt(max(0.0, $leadTimeDays * $demandVariance)),
        );
        $safetyStock = $config?->safety_stock ?? $derivedSafetyStock;

        $derivedRop = (int) round($avgDailyDemand * $leadTimeDays) + $safetyStock;
        $reorderPoint = $config?->reorder_point ?? $derivedRop;

        $isSeasonal = (bool) $product->is_seasonal;

        return [
            'sku_id' => $product->sku_id,
            'avg_daily_demand' => round($avgDailyDemand, 4),
            'annual_demand' => round($annualDemand, 4),
            'demand_variance' => round($demandVariance, 4),
            'lead_time_days' => $leadTimeDays,
            'safety_stock' => $safetyStock,
            'reorder_point' => $reorderPoint,
            'eoq' => $this->eoq($annualDemand, $config, $isSeasonal),
            'seasonal' => $isSeasonal,
            'seasonal_basis' => $isSeasonal ? $this->seasonalBasis($product->sku_id) : null,
            'window_days' => $this->windowDays,
        ];
    }

    /**
     * EOQ = sqrt((2 * annual_demand * order_cost) / holding_cost_per_unit)
     * for non-seasonal items when both operational cost inputs are present
     * and positive (OQ-6). Returns null otherwise.
     */
    public function eoq(float $annualDemand, ?ReorderConfig $config, bool $isSeasonal): ?float
    {
        if ($isSeasonal || $config === null) {
            return null;
        }

        $orderCost = $config->order_cost !== null ? (float) $config->order_cost : null;
        $holdingCost = $config->holding_cost_per_unit !== null
            ? (float) $config->holding_cost_per_unit
            : null;

        if ($orderCost === null || $holdingCost === null || $orderCost <= 0 || $holdingCost <= 0) {
            return null;
        }

        if ($annualDemand <= 0) {
            return 0.0;
        }

        return round(sqrt((2 * $annualDemand * $orderCost) / $holdingCost), 2);
    }

    /**
     * Daily demand series (one entry per day in the window, zero-filled),
     * derived from absolute SALE/PICK outflow.
     *
     * @return array<int, float>
     */
    private function dailyDemandSeries(string $skuId): array
    {
        $since = Carbon::now()->subDays($this->windowDays)->startOfDay();

        $rows = InventoryTransaction::query()
            ->whereHas('lot', fn ($q) => $q->where('sku_id', $skuId))
            ->whereIn('txn_type', self::DEMAND_TYPES)
            ->where('occurred_at', '>=', $since)
            ->get(['qty_delta', 'occurred_at']);

        $byDay = [];
        foreach ($rows as $row) {
            $day = Carbon::parse($row->occurred_at)->toDateString();
            $byDay[$day] = ($byDay[$day] ?? 0) + abs((int) $row->qty_delta);
        }

        // Zero-fill every day in the window so variance reflects idle days.
        $series = [];
        for ($i = 0; $i < $this->windowDays; $i++) {
            $day = Carbon::now()->subDays($i)->toDateString();
            $series[] = (float) ($byDay[$day] ?? 0);
        }

        return $series;
    }

    /**
     * Seasonal basis flag: whether same-period-last-year demand exists.
     */
    private function seasonalBasis(string $skuId): string
    {
        $windowStart = Carbon::now()->subYear()->subDays($this->windowDays);
        $windowEnd = Carbon::now()->subYear()->addDays($this->windowDays);

        $hasLastYear = InventoryTransaction::query()
            ->whereHas('lot', fn ($q) => $q->where('sku_id', $skuId))
            ->whereIn('txn_type', self::DEMAND_TYPES)
            ->whereBetween('occurred_at', [$windowStart, $windowEnd])
            ->exists();

        return $hasLastYear ? 'last_year' : 'insufficient_history';
    }

    /**
     * @param  array<int, float>  $values
     */
    private function mean(array $values): float
    {
        $count = count($values);

        return $count === 0 ? 0.0 : array_sum($values) / $count;
    }

    /**
     * Population variance.
     *
     * @param  array<int, float>  $values
     */
    private function variance(array $values): float
    {
        $count = count($values);
        if ($count === 0) {
            return 0.0;
        }

        $mean = $this->mean($values);
        $sumSquares = 0.0;
        foreach ($values as $value) {
            $sumSquares += ($value - $mean) ** 2;
        }

        return $sumSquares / $count;
    }
}
