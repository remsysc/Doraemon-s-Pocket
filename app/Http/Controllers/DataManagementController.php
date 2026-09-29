<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\DataManagement\ImportCategoriesRequest;
use App\Http\Requests\DataManagement\ImportProductsRequest;
use App\Services\DataManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DataManagementController extends Controller
{
    public function __construct(
        private readonly DataManagementService $dataManagementService
    ) {}

    /**
     * Export all categories as CSV.
     */
    public function exportCategories(Request $request): Response
    {
        $csv = $this->dataManagementService->exportCategoriesCsv();
        $filename = 'categories_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Import categories from CSV.
     */
    public function importCategories(ImportCategoriesRequest $request): JsonResponse
    {
        $result = $this->dataManagementService->importCategoriesCsv($request->file('file'));

        return response()->json($result);
    }

    /**
     * Export all products as CSV.
     */
    public function exportProducts(Request $request): Response
    {
        $csv = $this->dataManagementService->exportProductsCsv();
        $filename = 'products_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Import products from CSV.
     */
    public function importProducts(ImportProductsRequest $request): JsonResponse
    {
        $result = $this->dataManagementService->importProductsCsv($request->file('file'));

        return response()->json($result);
    }
}
