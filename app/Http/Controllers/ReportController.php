<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Get variance report.
     */
    public function variance(Request $request): JsonResponse
    {
        $filters = [
            'flagged_only' => $request->query('flagged_only', 'false'),
            'category_id' => $request->query('category_id'),
        ];

        $service = new ReportService;
        $report = $service->getVarianceReport($filters);

        return response()->json($report);
    }

    /**
     * Get turnover report.
     */
    public function turnover(Request $request): JsonResponse
    {
        $params = [
            'window_days' => $request->query('window_days'),
        ];

        $service = new ReportService;
        $report = $service->getTurnoverReport($params);

        return response()->json($report);
    }
}
