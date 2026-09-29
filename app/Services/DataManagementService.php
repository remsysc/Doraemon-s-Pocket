<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\CycleCount;
use App\Models\InventorySnapshot;
use App\Models\InventoryTransaction;
use App\Models\Lot;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DataManagementService
{
    public function __construct(
        private readonly InventoryTransactionService $transactionService = new InventoryTransactionService,
        private readonly CycleCountService $cycleCountService = new CycleCountService,
    ) {}

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Categories
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export all categories as a CSV string.
     */
    public function exportCategoriesCsv(?int $actorId = null): string
    {
        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, ['category_id', 'name', 'slug', 'description']);

        $categories = Category::query()->orderBy('name')->get();
        foreach ($categories as $category) {
            fputcsv($handle, [
                $category->category_id,
                $category->name,
                $category->slug,
                $category->description ?? '',
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        $this->recordAudit($actorId, 'bulk_export', 'Category', [
            'count' => $categories->count(),
        ]);

        return $csv !== false ? $csv : '';
    }

    /**
     * Import categories from an uploaded CSV file.
     *
     * @return array{message: string, imported_count: int, updated_count: int, errors: array<string>, dry_run: bool}
     */
    public function importCategoriesCsv(UploadedFile $file, bool $dryRun = false, ?int $actorId = null): array
    {
        $rows = $this->parseCsv($file);
        $importedCount = 0;
        $updatedCount = 0;
        $errors = [];

        // Pre-validation pass
        foreach ($rows as $index => $row) {
            $lineNum = $index + 2;
            $name = trim($row['name'] ?? '');

            if ($name === '') {
                $errors[] = "Line {$lineNum}: Category name is required.";
            }
        }

        if (! empty($errors)) {
            return [
                'message' => 'Validation failed with '.count($errors).' errors. No changes were applied.',
                'imported_count' => 0,
                'updated_count' => 0,
                'errors' => $errors,
                'dry_run' => $dryRun,
            ];
        }

        if ($dryRun) {
            return [
                'message' => 'Dry run passed. '.count($rows).' categories ready to import.',
                'imported_count' => count($rows),
                'updated_count' => 0,
                'errors' => [],
                'dry_run' => true,
            ];
        }

        DB::transaction(function () use ($rows, &$importedCount, &$updatedCount) {
            foreach ($rows as $row) {
                $name = trim($row['name']);
                $categoryId = ! empty($row['category_id']) ? trim($row['category_id']) : null;
                $slug = ! empty($row['slug']) ? Str::slug($row['slug']) : Str::slug($name);
                $description = isset($row['description']) && trim($row['description']) !== ''
                    ? trim($row['description'])
                    : null;

                $existing = null;
                if ($categoryId !== null) {
                    $existing = Category::withTrashed()->find($categoryId);
                }
                if ($existing === null) {
                    $existing = Category::withTrashed()->where('slug', $slug)->first();
                }

                if ($existing !== null) {
                    if ($existing->trashed()) {
                        $existing->restore();
                    }
                    $existing->update([
                        'name' => $name,
                        'slug' => $slug,
                        'description' => $description,
                    ]);
                    $updatedCount++;
                } else {
                    $attributes = [
                        'name' => $name,
                        'slug' => $slug,
                        'description' => $description,
                    ];
                    if ($categoryId !== null && Str::isUuid($categoryId)) {
                        $attributes['category_id'] = $categoryId;
                    }
                    Category::create($attributes);
                    $importedCount++;
                }
            }
        });

        $this->recordAudit($actorId, 'bulk_import', 'Category', [
            'imported_count' => $importedCount,
            'updated_count' => $updatedCount,
            'filename' => $file->getClientOriginalName(),
        ]);

        return [
            'message' => "Successfully imported {$importedCount} new and updated {$updatedCount} categories.",
            'imported_count' => $importedCount,
            'updated_count' => $updatedCount,
            'errors' => [],
            'dry_run' => false,
        ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Products
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export all products as a CSV string.
     */
    public function exportProductsCsv(?int $actorId = null): string
    {
        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, [
            'sku_id',
            'category_id',
            'category_name',
            'name',
            'description',
            'barcode',
            'unit_of_measure',
            'is_seasonal',
            'shelf_life_days',
            'is_active',
            'unit_cost',
            'unit_price',
        ]);

        $products = Product::query()->with('category')->orderBy('name')->get();
        foreach ($products as $product) {
            fputcsv($handle, [
                $product->sku_id,
                $product->category_id,
                $product->category?->name ?? '',
                $product->name,
                $product->description ?? '',
                $product->barcode,
                $product->unit_of_measure,
                $product->is_seasonal ? '1' : '0',
                $product->shelf_life_days ?? '',
                $product->is_active ? '1' : '0',
                $product->unit_cost ?? '',
                $product->unit_price ?? '',
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        $this->recordAudit($actorId, 'bulk_export', 'Product', [
            'count' => $products->count(),
        ]);

        return $csv !== false ? $csv : '';
    }

    /**
     * Import products from an uploaded CSV file.
     *
     * @return array{message: string, imported_count: int, updated_count: int, errors: array<string>, dry_run: bool}
     */
    public function importProductsCsv(UploadedFile $file, bool $dryRun = false, ?int $actorId = null): array
    {
        $rows = $this->parseCsv($file);
        $importedCount = 0;
        $updatedCount = 0;
        $errors = [];

        // Validation pass
        foreach ($rows as $index => $row) {
            $lineNum = $index + 2;
            $name = trim($row['name'] ?? '');
            $barcode = trim($row['barcode'] ?? '');

            if ($name === '') {
                $errors[] = "Line {$lineNum}: Product name is required.";
            }
            if ($barcode === '') {
                $errors[] = "Line {$lineNum}: Barcode is required.";
            }
        }

        if (! empty($errors)) {
            return [
                'message' => 'Validation failed with '.count($errors).' errors. No changes were applied.',
                'imported_count' => 0,
                'updated_count' => 0,
                'errors' => $errors,
                'dry_run' => $dryRun,
            ];
        }

        if ($dryRun) {
            return [
                'message' => 'Dry run passed. '.count($rows).' products ready to import.',
                'imported_count' => count($rows),
                'updated_count' => 0,
                'errors' => [],
                'dry_run' => true,
            ];
        }

        DB::transaction(function () use ($rows, &$importedCount, &$updatedCount) {
            foreach ($rows as $row) {
                $name = trim($row['name']);
                $barcode = trim($row['barcode']);

                // Resolve Category
                $categoryId = ! empty($row['category_id']) ? trim($row['category_id']) : null;
                $categoryName = ! empty($row['category_name']) ? trim($row['category_name']) : null;

                $category = null;
                if ($categoryId !== null) {
                    $category = Category::find($categoryId);
                }
                if ($category === null && $categoryName !== null) {
                    $category = Category::firstOrCreate(
                        ['slug' => Str::slug($categoryName)],
                        ['name' => $categoryName]
                    );
                }
                if ($category === null) {
                    $category = Category::first();
                    if ($category === null) {
                        $category = Category::create([
                            'name' => 'General',
                            'slug' => 'general',
                            'description' => 'Default Category',
                        ]);
                    }
                }

                $skuId = ! empty($row['sku_id']) ? trim($row['sku_id']) : null;
                $description = isset($row['description']) && trim($row['description']) !== ''
                    ? trim($row['description'])
                    : null;
                $unitOfMeasure = ! empty($row['unit_of_measure']) ? trim($row['unit_of_measure']) : 'unit';

                $rawSeasonal = strtolower(trim((string) ($row['is_seasonal'] ?? '0')));
                $isSeasonal = in_array($rawSeasonal, ['1', 'true', 'yes'], true);

                $rawShelfLife = trim((string) ($row['shelf_life_days'] ?? ''));
                $shelfLifeDays = is_numeric($rawShelfLife) ? (int) $rawShelfLife : null;

                $rawActive = strtolower(trim((string) ($row['is_active'] ?? '1')));
                $isActive = ! in_array($rawActive, ['0', 'false', 'no'], true);

                $rawCost = trim((string) ($row['unit_cost'] ?? ''));
                $unitCost = is_numeric($rawCost) ? (float) $rawCost : null;

                $rawPrice = trim((string) ($row['unit_price'] ?? ''));
                $unitPrice = is_numeric($rawPrice) ? (float) $rawPrice : null;

                $existing = null;
                if ($skuId !== null) {
                    $existing = Product::find($skuId);
                }
                if ($existing === null) {
                    $existing = Product::where('barcode', $barcode)->first();
                }

                if ($existing !== null) {
                    $existing->update([
                        'name' => $name,
                        'barcode' => $barcode,
                        'category_id' => $category->category_id,
                        'description' => $description,
                        'unit_of_measure' => $unitOfMeasure,
                        'is_seasonal' => $isSeasonal,
                        'shelf_life_days' => $shelfLifeDays,
                        'is_active' => $isActive,
                        'unit_cost' => $unitCost,
                        'unit_price' => $unitPrice,
                    ]);
                    $this->ensureSnapshot($existing->sku_id);
                    $updatedCount++;
                } else {
                    $attributes = [
                        'name' => $name,
                        'barcode' => $barcode,
                        'category_id' => $category->category_id,
                        'description' => $description,
                        'unit_of_measure' => $unitOfMeasure,
                        'is_seasonal' => $isSeasonal,
                        'shelf_life_days' => $shelfLifeDays,
                        'is_active' => $isActive,
                        'unit_cost' => $unitCost,
                        'unit_price' => $unitPrice,
                    ];
                    if ($skuId !== null && Str::isUuid($skuId)) {
                        $attributes['sku_id'] = $skuId;
                    }
                    $product = Product::create($attributes);
                    $this->ensureSnapshot($product->sku_id);
                    $importedCount++;
                }
            }
        });

        $this->recordAudit($actorId, 'bulk_import', 'Product', [
            'imported_count' => $importedCount,
            'updated_count' => $updatedCount,
            'filename' => $file->getClientOriginalName(),
        ]);

        return [
            'message' => "Successfully imported {$importedCount} new and updated {$updatedCount} products.",
            'imported_count' => $importedCount,
            'updated_count' => $updatedCount,
            'errors' => [],
            'dry_run' => false,
        ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Suppliers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export all suppliers as a CSV string.
     */
    public function exportSuppliersCsv(?int $actorId = null): string
    {
        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, [
            'id',
            'name',
            'contact_name',
            'contact_email',
            'contact_phone',
            'address',
            'lead_time_days',
            'is_active',
        ]);

        $suppliers = Supplier::query()->orderBy('name')->get();
        foreach ($suppliers as $s) {
            fputcsv($handle, [
                $s->id,
                $s->name,
                $s->contact_name ?? '',
                $s->contact_email ?? '',
                $s->contact_phone ?? '',
                $s->address ?? '',
                $s->lead_time_days,
                $s->is_active ? '1' : '0',
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        $this->recordAudit($actorId, 'bulk_export', 'Supplier', [
            'count' => $suppliers->count(),
        ]);

        return $csv !== false ? $csv : '';
    }

    /**
     * Import suppliers from an uploaded CSV file.
     *
     * @return array{message: string, imported_count: int, updated_count: int, errors: array<string>, dry_run: bool}
     */
    public function importSuppliersCsv(UploadedFile $file, bool $dryRun = false, ?int $actorId = null): array
    {
        $rows = $this->parseCsv($file);
        $importedCount = 0;
        $updatedCount = 0;
        $errors = [];

        // Validation pass
        foreach ($rows as $index => $row) {
            $lineNum = $index + 2;
            $name = trim($row['name'] ?? '');

            if ($name === '') {
                $errors[] = "Line {$lineNum}: Supplier name is required.";
            }

            if (! empty($row['contact_email']) && ! filter_var(trim($row['contact_email']), FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Line {$lineNum}: Invalid email format for contact_email.";
            }

            if (! empty($row['lead_time_days']) && (! is_numeric($row['lead_time_days']) || (int) $row['lead_time_days'] < 0)) {
                $errors[] = "Line {$lineNum}: lead_time_days must be a non-negative integer.";
            }
        }

        if (! empty($errors)) {
            return [
                'message' => 'Validation failed with '.count($errors).' errors. No changes were applied.',
                'imported_count' => 0,
                'updated_count' => 0,
                'errors' => $errors,
                'dry_run' => $dryRun,
            ];
        }

        if ($dryRun) {
            return [
                'message' => 'Dry run passed. '.count($rows).' suppliers ready to import.',
                'imported_count' => count($rows),
                'updated_count' => 0,
                'errors' => [],
                'dry_run' => true,
            ];
        }

        DB::transaction(function () use ($rows, &$importedCount, &$updatedCount) {
            foreach ($rows as $row) {
                $name = trim($row['name']);
                $id = ! empty($row['id']) ? trim($row['id']) : null;
                $contactName = ! empty($row['contact_name']) ? trim($row['contact_name']) : null;
                $contactEmail = ! empty($row['contact_email']) ? trim($row['contact_email']) : null;
                $contactPhone = ! empty($row['contact_phone']) ? trim($row['contact_phone']) : null;
                $address = ! empty($row['address']) ? trim($row['address']) : null;
                $leadTime = ! empty($row['lead_time_days']) ? (int) $row['lead_time_days'] : 7;

                $rawActive = strtolower(trim((string) ($row['is_active'] ?? '1')));
                $isActive = ! in_array($rawActive, ['0', 'false', 'no'], true);

                $existing = null;
                if ($id !== null && Str::isUuid($id)) {
                    $existing = Supplier::find($id);
                }
                if ($existing === null) {
                    $existing = Supplier::where('name', $name)->first();
                }

                if ($existing !== null) {
                    $existing->update([
                        'name' => $name,
                        'contact_name' => $contactName,
                        'contact_email' => $contactEmail,
                        'contact_phone' => $contactPhone,
                        'address' => $address,
                        'lead_time_days' => $leadTime,
                        'is_active' => $isActive,
                    ]);
                    $updatedCount++;
                } else {
                    $attributes = [
                        'name' => $name,
                        'contact_name' => $contactName,
                        'contact_email' => $contactEmail,
                        'contact_phone' => $contactPhone,
                        'address' => $address,
                        'lead_time_days' => $leadTime,
                        'is_active' => $isActive,
                    ];
                    if ($id !== null && Str::isUuid($id)) {
                        $attributes['id'] = $id;
                    }
                    Supplier::create($attributes);
                    $importedCount++;
                }
            }
        });

        $this->recordAudit($actorId, 'bulk_import', 'Supplier', [
            'imported_count' => $importedCount,
            'updated_count' => $updatedCount,
            'filename' => $file->getClientOriginalName(),
        ]);

        return [
            'message' => "Successfully imported {$importedCount} new and updated {$updatedCount} suppliers.",
            'imported_count' => $importedCount,
            'updated_count' => $updatedCount,
            'errors' => [],
            'dry_run' => false,
        ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Lots (Batches) with Synchronized Onboarding
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export all lots as a CSV string.
     */
    public function exportLotsCsv(?int $actorId = null): string
    {
        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, [
            'lot_id',
            'barcode',
            'sku_id',
            'product_name',
            'bin_location',
            'received_date',
            'expiry_date',
        ]);

        $lots = Lot::query()->with('product')->orderBy('received_date', 'desc')->get();
        foreach ($lots as $lot) {
            fputcsv($handle, [
                $lot->lot_id,
                $lot->product?->barcode ?? '',
                $lot->sku_id,
                $lot->product?->name ?? '',
                $lot->bin_location,
                $lot->received_date,
                $lot->expiry_date ?? '',
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        $this->recordAudit($actorId, 'bulk_export', 'Lot', [
            'count' => $lots->count(),
        ]);

        return $csv !== false ? $csv : '';
    }

    /**
     * Import lots from CSV with synchronized inbound ledger receipt and snapshot update.
     *
     * @return array{message: string, imported_count: int, updated_count: int, errors: array<string>, dry_run: bool}
     */
    public function importLotsCsv(UploadedFile $file, bool $dryRun = false, ?int $actorId = null): array
    {
        $rows = $this->parseCsv($file);
        $importedCount = 0;
        $updatedCount = 0;
        $errors = [];

        // Validation pass
        foreach ($rows as $index => $row) {
            $lineNum = $index + 2;
            $barcode = trim($row['barcode'] ?? '');
            $skuId = trim($row['sku_id'] ?? '');
            $binLocation = trim($row['bin_location'] ?? '');
            $quantity = trim($row['quantity'] ?? '0');
            $receivedDate = trim($row['received_date'] ?? '');

            if ($barcode === '' && $skuId === '') {
                $errors[] = "Line {$lineNum}: Product barcode or sku_id is required.";
            } else {
                $product = $barcode !== ''
                    ? Product::where('barcode', $barcode)->first()
                    : Product::find($skuId);

                if ($product === null) {
                    $identifier = $barcode !== '' ? "barcode '{$barcode}'" : "sku_id '{$skuId}'";
                    $errors[] = "Line {$lineNum}: Product with {$identifier} not found.";
                }
            }

            if ($binLocation === '') {
                $errors[] = "Line {$lineNum}: bin_location is required.";
            }

            if (! is_numeric($quantity) || (int) $quantity <= 0) {
                $errors[] = "Line {$lineNum}: quantity must be a positive integer.";
            }

            if ($receivedDate === '') {
                $errors[] = "Line {$lineNum}: received_date is required (format: YYYY-MM-DD HH:MM:SS or YYYY-MM-DD).";
            }
        }

        if (! empty($errors)) {
            return [
                'message' => 'Validation failed with '.count($errors).' errors. No changes were applied.',
                'imported_count' => 0,
                'updated_count' => 0,
                'errors' => $errors,
                'dry_run' => $dryRun,
            ];
        }

        if ($dryRun) {
            return [
                'message' => 'Dry run passed. '.count($rows).' lot batches ready to import and sync.',
                'imported_count' => count($rows),
                'updated_count' => 0,
                'errors' => [],
                'dry_run' => true,
            ];
        }

        DB::transaction(function () use ($rows, $actorId, &$importedCount) {
            $effectiveActorId = $actorId ?? (int) (DB::table('users')->value('id') ?? 1);

            foreach ($rows as $row) {
                $barcode = trim($row['barcode'] ?? '');
                $skuId = trim($row['sku_id'] ?? '');
                $product = $barcode !== ''
                    ? Product::where('barcode', $barcode)->firstOrFail()
                    : Product::findOrFail($skuId);

                $lotId = ! empty($row['lot_id']) && Str::isUuid(trim($row['lot_id']))
                    ? trim($row['lot_id'])
                    : Str::uuid()->toString();

                $binLocation = trim($row['bin_location']);
                $quantity = (int) trim($row['quantity']);
                $receivedDate = trim($row['received_date']);
                $expiryDate = ! empty($row['expiry_date']) ? trim($row['expiry_date']) : null;

                $lot = Lot::create([
                    'lot_id' => $lotId,
                    'sku_id' => $product->sku_id,
                    'received_date' => $receivedDate,
                    'expiry_date' => $expiryDate,
                    'bin_location' => $binLocation,
                ]);

                // Synchronized Onboarding: record RECEIPT transaction and increment snapshot
                $this->transactionService->record([
                    'lot_id' => $lot->lot_id,
                    'txn_type' => 'RECEIPT',
                    'qty_delta' => $quantity,
                    'occurred_at' => $receivedDate,
                ], $effectiveActorId);

                $importedCount++;
            }
        });

        $this->recordAudit($actorId, 'bulk_import', 'Lot', [
            'imported_count' => $importedCount,
            'filename' => $file->getClientOriginalName(),
        ]);

        return [
            'message' => "Successfully imported {$importedCount} lot batches with synchronized stock onboarding.",
            'imported_count' => $importedCount,
            'updated_count' => 0,
            'errors' => [],
            'dry_run' => false,
        ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Purchase Orders
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export all purchase orders and line items as a flattened CSV string.
     */
    public function exportPurchaseOrdersCsv(?int $actorId = null): string
    {
        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, [
            'po_number',
            'supplier_name',
            'status',
            'order_date',
            'expected_delivery_date',
            'notes',
            'barcode',
            'product_name',
            'quantity_ordered',
            'quantity_received',
            'unit_cost',
            'total_cost',
        ]);

        $orders = PurchaseOrder::query()->with(['supplier', 'items.product'])->orderBy('po_number')->get();
        $totalItems = 0;

        foreach ($orders as $po) {
            foreach ($po->items as $item) {
                $totalItems++;
                fputcsv($handle, [
                    $po->po_number,
                    $po->supplier?->name ?? '',
                    $po->status,
                    $po->order_date?->format('Y-m-d') ?? '',
                    $po->expected_delivery_date?->format('Y-m-d') ?? '',
                    $po->notes ?? '',
                    $item->product?->barcode ?? '',
                    $item->product?->name ?? '',
                    $item->quantity_ordered,
                    $item->quantity_received,
                    $item->unit_cost,
                    $item->total_cost,
                ]);
            }
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        $this->recordAudit($actorId, 'bulk_export', 'PurchaseOrder', [
            'po_count' => $orders->count(),
            'line_items_count' => $totalItems,
        ]);

        return $csv !== false ? $csv : '';
    }

    /**
     * Import purchase orders from flattened line-item CSV.
     * Groups rows by po_number into draft purchase orders.
     *
     * @return array{message: string, imported_count: int, updated_count: int, errors: array<string>, dry_run: bool}
     */
    public function importPurchaseOrdersCsv(UploadedFile $file, bool $dryRun = false, ?int $actorId = null): array
    {
        $rows = $this->parseCsv($file);
        $importedCount = 0;
        $errors = [];

        // Group rows by po_number for validation and creation
        $grouped = [];

        foreach ($rows as $index => $row) {
            $lineNum = $index + 2;
            $poNumber = trim($row['po_number'] ?? '');
            $supplierName = trim($row['supplier_name'] ?? '');
            $barcode = trim($row['barcode'] ?? '');
            $qty = trim($row['quantity_ordered'] ?? '');

            if ($poNumber === '') {
                $errors[] = "Line {$lineNum}: po_number is required.";
            }

            if ($supplierName === '') {
                $errors[] = "Line {$lineNum}: supplier_name is required.";
            }

            if ($barcode === '') {
                $errors[] = "Line {$lineNum}: Product barcode is required.";
            } else {
                $product = Product::where('barcode', $barcode)->first();
                if ($product === null) {
                    $errors[] = "Line {$lineNum}: Product with barcode '{$barcode}' not found.";
                }
            }

            if (! is_numeric($qty) || (int) $qty <= 0) {
                $errors[] = "Line {$lineNum}: quantity_ordered must be a positive integer.";
            }

            $grouped[$poNumber][] = $row;
        }

        if (! empty($errors)) {
            return [
                'message' => 'Validation failed with '.count($errors).' errors. No changes were applied.',
                'imported_count' => 0,
                'updated_count' => 0,
                'errors' => $errors,
                'dry_run' => $dryRun,
            ];
        }

        if ($dryRun) {
            $poCount = count($grouped);

            return [
                'message' => "Dry run passed. {$poCount} purchase orders (".count($rows).' line items) ready to import.',
                'imported_count' => $poCount,
                'updated_count' => 0,
                'errors' => [],
                'dry_run' => true,
            ];
        }

        DB::transaction(function () use ($grouped, $actorId, &$importedCount) {
            $effectiveActorId = $actorId ?? (int) (DB::table('users')->value('id') ?? 1);

            foreach ($grouped as $poNumber => $items) {
                $firstRow = $items[0];
                $supplierName = trim($firstRow['supplier_name']);
                $supplier = Supplier::firstOrCreate(
                    ['name' => $supplierName],
                    ['lead_time_days' => 7, 'is_active' => true]
                );

                $orderDate = ! empty($firstRow['order_date']) ? trim($firstRow['order_date']) : now()->toDateString();
                $expectedDate = ! empty($firstRow['expected_delivery_date']) ? trim($firstRow['expected_delivery_date']) : null;
                $notes = ! empty($firstRow['notes']) ? trim($firstRow['notes']) : null;

                // Create or find existing PO
                $po = PurchaseOrder::where('po_number', $poNumber)->first();
                if ($po === null) {
                    $po = PurchaseOrder::create([
                        'po_number' => $poNumber,
                        'supplier_id' => $supplier->id,
                        'status' => 'draft',
                        'order_date' => $orderDate,
                        'expected_delivery_date' => $expectedDate,
                        'notes' => $notes,
                        'total_amount' => 0,
                        'created_by' => $effectiveActorId,
                    ]);
                    $importedCount++;
                }

                $runningTotal = (float) $po->total_amount;

                foreach ($items as $itemRow) {
                    $barcode = trim($itemRow['barcode']);
                    $product = Product::where('barcode', $barcode)->firstOrFail();
                    $qty = (int) trim($itemRow['quantity_ordered']);

                    $rawCost = trim((string) ($itemRow['unit_cost'] ?? ''));
                    $unitCost = is_numeric($rawCost) ? (float) $rawCost : (float) ($product->unit_cost ?? 0);
                    $lineTotal = round($qty * $unitCost, 2);

                    PurchaseOrderItem::create([
                        'po_id' => $po->id,
                        'sku_id' => $product->sku_id,
                        'quantity_ordered' => $qty,
                        'quantity_received' => 0,
                        'unit_cost' => $unitCost,
                        'total_cost' => $lineTotal,
                    ]);

                    $runningTotal += $lineTotal;
                }

                $po->update(['total_amount' => $runningTotal]);
            }
        });

        $this->recordAudit($actorId, 'bulk_import', 'PurchaseOrder', [
            'imported_po_count' => $importedCount,
            'filename' => $file->getClientOriginalName(),
        ]);

        return [
            'message' => "Successfully imported {$importedCount} purchase orders.",
            'imported_count' => $importedCount,
            'updated_count' => 0,
            'errors' => [],
            'dry_run' => false,
        ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. Cycle Counts (Stocktake)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export cycle counts / variances as a CSV string.
     */
    public function exportCycleCountsCsv(?string $status = null, ?int $actorId = null): string
    {
        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, [
            'id',
            'sku_id',
            'barcode',
            'product_name',
            'lot_id',
            'expected_qty',
            'counted_qty',
            'variance_qty',
            'variance_pct',
            'is_flagged',
            'status',
            'counter_name',
            'notes',
            'counted_at',
        ]);

        $query = CycleCount::query()->with('product')->orderBy('counted_at', 'desc');
        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        $counts = $query->get();
        foreach ($counts as $c) {
            fputcsv($handle, [
                $c->id,
                $c->sku_id,
                $c->product?->barcode ?? '',
                $c->product?->name ?? '',
                $c->lot_id ?? '',
                $c->expected_qty,
                $c->counted_qty,
                $c->variance_qty,
                $c->variance_pct,
                $c->is_flagged ? '1' : '0',
                $c->status,
                $c->counter_name,
                $c->notes ?? '',
                $c->counted_at?->toIso8601String() ?? '',
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        $this->recordAudit($actorId, 'bulk_export', 'CycleCount', [
            'count' => $counts->count(),
            'status_filter' => $status,
        ]);

        return $csv !== false ? $csv : '';
    }

    /**
     * Import a physical stocktake count sheet CSV.
     *
     * @return array{message: string, imported_count: int, updated_count: int, errors: array<string>, dry_run: bool}
     */
    public function importCycleCountSheetCsv(UploadedFile $file, bool $dryRun = false, ?int $actorId = null, ?string $actorName = null): array
    {
        $rows = $this->parseCsv($file);
        $importedCount = 0;
        $errors = [];

        // Validation pass
        foreach ($rows as $index => $row) {
            $lineNum = $index + 2;
            $barcode = trim($row['barcode'] ?? '');
            $skuId = trim($row['sku_id'] ?? '');
            $countedQty = trim($row['counted_quantity'] ?? '');

            if ($barcode === '' && $skuId === '') {
                $errors[] = "Line {$lineNum}: Product barcode or sku_id is required.";
            } else {
                $product = $barcode !== ''
                    ? Product::where('barcode', $barcode)->first()
                    : Product::find($skuId);

                if ($product === null) {
                    $identifier = $barcode !== '' ? "barcode '{$barcode}'" : "sku_id '{$skuId}'";
                    $errors[] = "Line {$lineNum}: Product with {$identifier} not found.";
                }
            }

            if (! is_numeric($countedQty) || (int) $countedQty < 0) {
                $errors[] = "Line {$lineNum}: counted_quantity must be a non-negative integer.";
            }
        }

        if (! empty($errors)) {
            return [
                'message' => 'Validation failed with '.count($errors).' errors. No changes were applied.',
                'imported_count' => 0,
                'updated_count' => 0,
                'errors' => $errors,
                'dry_run' => $dryRun,
            ];
        }

        if ($dryRun) {
            return [
                'message' => 'Dry run passed. '.count($rows).' count rows ready to record.',
                'imported_count' => count($rows),
                'updated_count' => 0,
                'errors' => [],
                'dry_run' => true,
            ];
        }

        DB::transaction(function () use ($rows, $actorId, $actorName, &$importedCount) {
            $effectiveActorId = $actorId ?? (int) (DB::table('users')->value('id') ?? 1);
            $effectiveActorName = $actorName ?? 'Stock Counter';

            foreach ($rows as $row) {
                $barcode = trim($row['barcode'] ?? '');
                $skuId = trim($row['sku_id'] ?? '');
                $product = $barcode !== ''
                    ? Product::where('barcode', $barcode)->firstOrFail()
                    : Product::findOrFail($skuId);

                $lotId = ! empty($row['lot_id']) ? trim($row['lot_id']) : null;
                $countedQty = (int) trim($row['counted_quantity']);
                $notes = ! empty($row['notes']) ? trim($row['notes']) : 'Bulk sheet import';

                $this->cycleCountService->recordCount([
                    'sku_id' => $product->sku_id,
                    'lot_id' => $lotId,
                    'counted_qty' => $countedQty,
                    'counted_by' => $effectiveActorId,
                    'counter_name' => $effectiveActorName,
                    'notes' => $notes,
                ]);

                $importedCount++;
            }
        });

        $this->recordAudit($actorId, 'bulk_import', 'CycleCount', [
            'imported_count' => $importedCount,
            'filename' => $file->getClientOriginalName(),
        ]);

        return [
            'message' => "Successfully recorded {$importedCount} cycle counts from sheet.",
            'imported_count' => $importedCount,
            'updated_count' => 0,
            'errors' => [],
            'dry_run' => false,
        ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. Inventory Transactions (Append-Only Ledger Export)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export inventory transactions ledger as a CSV string.
     */
    public function exportInventoryTransactionsCsv(
        ?string $fromDate = null,
        ?string $toDate = null,
        ?string $txnType = null,
        ?int $actorId = null,
    ): string {
        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, [
            'txn_id',
            'occurred_at',
            'txn_type',
            'qty_delta',
            'sku_id',
            'barcode',
            'product_name',
            'lot_id',
            'actor_id',
            'actor_name',
            'created_at',
        ]);

        $query = InventoryTransaction::query()->with(['lot.product', 'actor'])->orderBy('occurred_at', 'desc');

        if ($fromDate !== null && $fromDate !== '') {
            $query->where('occurred_at', '>=', $fromDate);
        }
        if ($toDate !== null && $toDate !== '') {
            $query->where('occurred_at', '<=', $toDate);
        }
        if ($txnType !== null && $txnType !== '') {
            $query->where('txn_type', $txnType);
        }

        $transactions = $query->get();
        foreach ($transactions as $t) {
            fputcsv($handle, [
                $t->txn_id,
                $t->occurred_at,
                $t->txn_type,
                $t->qty_delta,
                $t->lot?->product?->sku_id ?? '',
                $t->lot?->product?->barcode ?? '',
                $t->lot?->product?->name ?? '',
                $t->lot_id,
                $t->actor_id,
                $t->actor?->name ?? '',
                $t->created_at?->toIso8601String() ?? '',
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        $this->recordAudit($actorId, 'bulk_export', 'InventoryTransaction', [
            'count' => $transactions->count(),
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'txn_type' => $txnType,
        ]);

        return $csv !== false ? $csv : '';
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 8. Sample CSV Templates
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Generate a downloadable sample CSV template for an entity.
     */
    public function generateSampleCsv(string $type): string
    {
        $handle = fopen('php://temp', 'r+');

        switch ($type) {
            case 'categories':
                fputcsv($handle, ['category_id', 'name', 'slug', 'description']);
                fputcsv($handle, ['', 'Kitchen Appliances', 'kitchen-appliances', 'Kitchen and cooking electrics']);
                fputcsv($handle, ['', 'Cooling & Fans', 'cooling-fans', 'Electric fans and air coolers']);
                break;

            case 'products':
                fputcsv($handle, [
                    'sku_id',
                    'category_name',
                    'name',
                    'description',
                    'barcode',
                    'unit_of_measure',
                    'is_seasonal',
                    'shelf_life_days',
                    'is_active',
                    'unit_cost',
                    'unit_price',
                ]);
                fputcsv($handle, [
                    '',
                    'Kitchen Appliances',
                    'Electric Kettle 1.5L',
                    'Stainless steel cordless kettle',
                    'WB-KETTLE-01',
                    'unit',
                    '0',
                    '730',
                    '1',
                    '18.50',
                    '34.99',
                ]);
                break;

            case 'suppliers':
                fputcsv($handle, [
                    'name',
                    'contact_name',
                    'contact_email',
                    'contact_phone',
                    'address',
                    'lead_time_days',
                    'is_active',
                ]);
                fputcsv($handle, [
                    'Global Appliance Supplies Inc',
                    'Maria Santos',
                    'maria@globalappliance.ph',
                    '+63 917 555 1234',
                    'Warehouse 4, Laguna Technopark',
                    '7',
                    '1',
                ]);
                break;

            case 'lots':
                fputcsv($handle, [
                    'lot_id',
                    'barcode',
                    'bin_location',
                    'quantity',
                    'received_date',
                    'expiry_date',
                ]);
                fputcsv($handle, [
                    '',
                    'WB-KETTLE-01',
                    'BIN-A-01',
                    '50',
                    now()->format('Y-m-d H:i:s'),
                    now()->addYears(2)->format('Y-m-d'),
                ]);
                break;

            case 'purchase_orders':
                fputcsv($handle, [
                    'po_number',
                    'supplier_name',
                    'order_date',
                    'expected_delivery_date',
                    'notes',
                    'barcode',
                    'quantity_ordered',
                    'unit_cost',
                ]);
                fputcsv($handle, [
                    'PO-2026-001',
                    'Global Appliance Supplies Inc',
                    now()->format('Y-m-d'),
                    now()->addDays(14)->format('Y-m-d'),
                    'Standard stock replenishment',
                    'WB-KETTLE-01',
                    '100',
                    '18.50',
                ]);
                break;

            case 'cycle_counts':
            case 'cycle_count_sheet':
                fputcsv($handle, ['barcode', 'lot_id', 'counted_quantity', 'notes']);
                fputcsv($handle, ['WB-KETTLE-01', '', '48', 'Counted on Main Shelf A-01']);
                break;

            default:
                fputcsv($handle, ['error']);
                fputcsv($handle, ["Unknown template type: {$type}"]);
                break;
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv !== false ? $csv : '';
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Ensure an inventory snapshot exists for the product.
     */
    private function ensureSnapshot(string $skuId): void
    {
        InventorySnapshot::firstOrCreate(
            ['sku_id' => $skuId],
            [
                'qty_on_hand' => 0,
                'qty_reserved' => 0,
                'qty_available' => 0,
            ]
        );
    }

    /**
     * Record an audit log entry for a bulk operation.
     *
     * @param  array<string, mixed>  $metadata
     */
    private function recordAudit(?int $actorId, string $action, string $entityType, array $metadata): void
    {
        if ($actorId === null) {
            return;
        }

        AuditLog::create([
            'actor_id' => $actorId,
            'action' => $action,
            'entity_id' => Str::uuid()->toString(),
            'entity_type' => $entityType,
            'old_values' => null,
            'new_values' => $metadata,
            'occurred_at' => now(),
        ]);
    }

    /**
     * Parse an uploaded CSV file into an array of associative rows.
     *
     * @return array<int, array<string, string>>
     */
    private function parseCsv(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            return [];
        }

        $headers = null;
        $rows = [];

        while (($data = fgetcsv($handle)) !== false) {
            if ($headers === null) {
                // Strip UTF-8 BOM if present
                if (isset($data[0])) {
                    $data[0] = preg_replace('/^\xEF\xBB\xBF/', '', $data[0]);
                }
                $headers = array_map(fn ($h) => strtolower(trim((string) $h)), $data);

                continue;
            }

            // Skip empty rows
            if (count($data) === 1 && $data[0] === null) {
                continue;
            }

            $row = [];
            foreach ($headers as $index => $header) {
                $row[$header] = $data[$index] ?? '';
            }
            $rows[] = $row;
        }

        fclose($handle);

        return $rows;
    }
}
