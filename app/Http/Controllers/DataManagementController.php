<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\DataManagement\ImportCategoriesRequest;
use App\Http\Requests\DataManagement\ImportCycleCountSheetRequest;
use App\Http\Requests\DataManagement\ImportLotsRequest;
use App\Http\Requests\DataManagement\ImportProductsRequest;
use App\Http\Requests\DataManagement\ImportPurchaseOrdersRequest;
use App\Http\Requests\DataManagement\ImportSuppliersRequest;
use App\Services\DataManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DataManagementController extends Controller
{
    public function __construct(
        private readonly DataManagementService $dataManagementService
    ) {}

    // ──────────────────────────────────────────────────────────────────────────
    // Categories
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export all categories as CSV.
     */
    public function exportCategories(Request $request): Response
    {
        $csv = $this->dataManagementService->exportCategoriesCsv($request->user()?->id);
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
        $dryRun = $request->boolean('dry_run');
        $result = $this->dataManagementService->importCategoriesCsv(
            $request->file('file'),
            $dryRun,
            $request->user()?->id,
        );

        return response()->json($result);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Products
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export all products as CSV.
     */
    public function exportProducts(Request $request): Response
    {
        $csv = $this->dataManagementService->exportProductsCsv($request->user()?->id);
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
        $dryRun = $request->boolean('dry_run');
        $result = $this->dataManagementService->importProductsCsv(
            $request->file('file'),
            $dryRun,
            $request->user()?->id,
        );

        return response()->json($result);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Suppliers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export all suppliers as CSV.
     */
    public function exportSuppliers(Request $request): Response
    {
        $csv = $this->dataManagementService->exportSuppliersCsv($request->user()?->id);
        $filename = 'suppliers_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Import suppliers from CSV.
     */
    public function importSuppliers(ImportSuppliersRequest $request): JsonResponse
    {
        $dryRun = $request->boolean('dry_run');
        $result = $this->dataManagementService->importSuppliersCsv(
            $request->file('file'),
            $dryRun,
            $request->user()?->id,
        );

        return response()->json($result);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Lots (Batches)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export all lots as CSV.
     */
    public function exportLots(Request $request): Response
    {
        $csv = $this->dataManagementService->exportLotsCsv($request->user()?->id);
        $filename = 'lots_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Import lots from CSV with synchronized inbound ledger receipt.
     */
    public function importLots(ImportLotsRequest $request): JsonResponse
    {
        $dryRun = $request->boolean('dry_run');
        $result = $this->dataManagementService->importLotsCsv(
            $request->file('file'),
            $dryRun,
            $request->user()?->id,
        );

        return response()->json($result);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Purchase Orders
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export all purchase orders and line items as flattened CSV.
     */
    public function exportPurchaseOrders(Request $request): Response
    {
        $csv = $this->dataManagementService->exportPurchaseOrdersCsv($request->user()?->id);
        $filename = 'purchase_orders_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Import purchase orders from flattened line-item CSV.
     */
    public function importPurchaseOrders(ImportPurchaseOrdersRequest $request): JsonResponse
    {
        $dryRun = $request->boolean('dry_run');
        $result = $this->dataManagementService->importPurchaseOrdersCsv(
            $request->file('file'),
            $dryRun,
            $request->user()?->id,
        );

        return response()->json($result);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Cycle Counts (Stocktake)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export cycle counts as CSV.
     */
    public function exportCycleCounts(Request $request): Response
    {
        $status = $request->query('status');
        $csv = $this->dataManagementService->exportCycleCountsCsv(
            is_string($status) ? $status : null,
            $request->user()?->id,
        );
        $filename = 'cycle_counts_export_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Import stocktake count sheet CSV.
     */
    public function importCycleCounts(ImportCycleCountSheetRequest $request): JsonResponse
    {
        $dryRun = $request->boolean('dry_run');
        $result = $this->dataManagementService->importCycleCountSheetCsv(
            $request->file('file'),
            $dryRun,
            $request->user()?->id,
            $request->user()?->name,
        );

        return response()->json($result);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Inventory Transactions (Append-Only Ledger Export)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export ledger transactions as CSV.
     */
    public function exportInventoryTransactions(Request $request): Response
    {
        $fromDate = $request->query('from_date');
        $toDate = $request->query('to_date');
        $txnType = $request->query('txn_type');

        $csv = $this->dataManagementService->exportInventoryTransactionsCsv(
            is_string($fromDate) ? $fromDate : null,
            is_string($toDate) ? $toDate : null,
            is_string($txnType) ? $txnType : null,
            $request->user()?->id,
        );
        $filename = 'inventory_transactions_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Sample CSV Templates
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Download a sample CSV template with headers and example rows.
     */
    public function downloadTemplate(Request $request, string $type): Response
    {
        $csv = $this->dataManagementService->generateSampleCsv($type);
        $filename = "sample_{$type}_template.csv";

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
