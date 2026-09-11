<?php

namespace App\Services;

use App\Models\InventoryTransaction;
use App\Models\Product;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * ABC/XYZ classification (SPEC FR-15).
 *
 * ABC ranks SKUs by cumulative demand volume (Pareto): A <= 80%, B <= 95%,
 * C the remainder. Volume — not value — because pricing is out of scope.
 * XYZ ranks by coefficient of variation of daily demand: X < 0.5 (stable),
 * Y < 1.0 (variable), Z >= 1.0 (erratic). Zero-demand SKUs are Z.
 */
class ClassificationService
{
    private const DEMAND_TYPES = ['SALE', 'PICK'];

    public function __construct(
        private readonly int $windowDays = 90,
    ) {}

    public static function make(): self
    {
        return new self((int) config('inventory.reorder_demand_window_days', 90));
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function classifyAll(): Collection
    {
        $products = Product::query()->with('category')->get();

        $stats = $products->mapWithKeys(function (Product $product): array {
            $series = $this->dailyDemandSeries($product->sku_id);
            $mean = $this->mean($series);
            $annualDemand = $mean * 365;
            $cv = $mean > 0.0 ? $this->stddev($series) / $mean : INF;

            return [$product->sku_id => [
                'product' => $product,
                'annual_demand' => $annualDemand,
                'cv' => $cv,
            ]];
        });

        $totalDemand = $stats->sum(fn (array $s): float => $s['annual_demand']);

        // Assign ABC by descending demand share (cumulative Pareto).
        $ranked = $stats
            ->sortByDesc(fn (array $s): float => $s['annual_demand']);

        $cumulativeBefore = 0.0;
        $result = collect();
        foreach ($ranked as $skuId => $s) {
            $share = $totalDemand > 0.0 ? $s['annual_demand'] / $totalDemand : 0.0;

            $result->push([
                'sku_id' => $skuId,
                'product' => $s['product'],
                'abc' => $this->abcClass($cumulativeBefore, $s['annual_demand'], $totalDemand),
                'xyz' => $this->xyzClass($s['cv']),
                'annual_demand' => round($s['annual_demand'], 4),
                'cv' => is_finite($s['cv']) ? round($s['cv'], 4) : null,
            ]);

            $cumulativeBefore += $share;
        }

        return $result;
    }

    /**
     * ABC class from the cumulative demand share that precedes this item
     * (its lower band boundary). An item that starts within the A band is A
     * even when it alone pushes the cumulative past 80%. Zero-demand items
     * are always C.
     */
    private function abcClass(float $cumulativeBefore, float $annualDemand, float $totalDemand): string
    {
        if ($totalDemand <= 0.0 || $annualDemand <= 0.0) {
            return 'C';
        }
        if ($cumulativeBefore < 0.80) {
            return 'A';
        }
        if ($cumulativeBefore < 0.95) {
            return 'B';
        }

        return 'C';
    }

    private function xyzClass(float $cv): string
    {
        if (! is_finite($cv)) {
            return 'Z';
        }
        if ($cv < 0.5) {
            return 'X';
        }
        if ($cv < 1.0) {
            return 'Y';
        }

        return 'Z';
    }

    /**
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

        $series = [];
        for ($i = 0; $i < $this->windowDays; $i++) {
            $day = Carbon::now()->subDays($i)->toDateString();
            $series[] = (float) ($byDay[$day] ?? 0);
        }

        return $series;
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
     * @param  array<int, float>  $values
     */
    private function stddev(array $values): float
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

        return sqrt($sumSquares / $count);
    }
}
