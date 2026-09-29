<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use App\Models\InventorySnapshot;
use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DataManagementService
{
    /**
     * Export all categories as a CSV string.
     */
    public function exportCategoriesCsv(): string
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

        return $csv !== false ? $csv : '';
    }

    /**
     * Import categories from an uploaded CSV file.
     *
     * @return array{message: string, imported_count: int, updated_count: int, errors: array<string>}
     */
    public function importCategoriesCsv(UploadedFile $file): array
    {
        $rows = $this->parseCsv($file);
        $importedCount = 0;
        $updatedCount = 0;
        $errors = [];

        DB::transaction(function () use ($rows, &$importedCount, &$updatedCount, &$errors) {
            foreach ($rows as $index => $row) {
                $lineNum = $index + 2; // Accounting for 1-based index and header row
                $name = trim($row['name'] ?? '');

                if ($name === '') {
                    $errors[] = "Line {$lineNum}: Category name is required.";

                    continue;
                }

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

        return [
            'message' => "Successfully imported {$importedCount} new and updated {$updatedCount} categories.",
            'imported_count' => $importedCount,
            'updated_count' => $updatedCount,
            'errors' => $errors,
        ];
    }

    /**
     * Export all products as a CSV string.
     */
    public function exportProductsCsv(): string
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

        return $csv !== false ? $csv : '';
    }

    /**
     * Import products from an uploaded CSV file.
     *
     * @return array{message: string, imported_count: int, updated_count: int, errors: array<string>}
     */
    public function importProductsCsv(UploadedFile $file): array
    {
        $rows = $this->parseCsv($file);
        $importedCount = 0;
        $updatedCount = 0;
        $errors = [];

        DB::transaction(function () use ($rows, &$importedCount, &$updatedCount, &$errors) {
            foreach ($rows as $index => $row) {
                $lineNum = $index + 2;
                $name = trim($row['name'] ?? '');
                $barcode = trim($row['barcode'] ?? '');

                if ($name === '') {
                    $errors[] = "Line {$lineNum}: Product name is required.";

                    continue;
                }
                if ($barcode === '') {
                    $errors[] = "Line {$lineNum}: Barcode is required.";

                    continue;
                }

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

                // Match existing product by sku_id or barcode
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

        return [
            'message' => "Successfully imported {$importedCount} new and updated {$updatedCount} products.",
            'imported_count' => $importedCount,
            'updated_count' => $updatedCount,
            'errors' => $errors,
        ];
    }

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
