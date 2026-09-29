<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseOrders\DestroyPurchaseOrderRequest;
use App\Http\Requests\PurchaseOrders\IndexPurchaseOrderRequest;
use App\Http\Requests\PurchaseOrders\ReceivePurchaseOrderRequest;
use App\Http\Requests\PurchaseOrders\ShowPurchaseOrderRequest;
use App\Http\Requests\PurchaseOrders\StorePurchaseOrderRequest;
use App\Http\Requests\PurchaseOrders\UpdatePurchaseOrderRequest;
use App\Http\Resources\PurchaseOrderResource;
use App\Models\Lot;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Services\InventoryTransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PurchaseOrderController extends Controller
{
    public function __construct(private readonly InventoryTransactionService $transactionService) {}

    public function index(IndexPurchaseOrderRequest $request): AnonymousResourceCollection
    {
        $orders = QueryBuilder::for(PurchaseOrder::class)
            ->with(['supplier', 'items.product'])
            ->allowedFilters(
                AllowedFilter::exact('status'),
                AllowedFilter::exact('supplier_id'),
            )
            ->allowedSorts('status', 'order_date', 'created_at')
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return PurchaseOrderResource::collection($orders);
    }

    public function show(ShowPurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): PurchaseOrderResource
    {
        $purchaseOrder->loadMissing(['supplier', 'items.product']);

        return new PurchaseOrderResource($purchaseOrder);
    }

    public function store(StorePurchaseOrderRequest $request): JsonResponse
    {
        $data = $request->validated();
        $items = $data['items'] ?? [];
        unset($data['items']);

        $po = DB::transaction(function () use ($data, $items, $request): PurchaseOrder {
            $po = PurchaseOrder::create([
                ...$data,
                'po_number' => 'PO-'.strtoupper(Str::random(8)),
                'created_by' => $request->user()->id,
                'status' => 'draft',
            ]);

            foreach ($items as $item) {
                $unitCost = $item['unit_cost'] ?? 0;
                PurchaseOrderItem::create([
                    'po_id' => $po->id,
                    'sku_id' => $item['sku_id'],
                    'quantity_ordered' => $item['quantity_ordered'],
                    'unit_cost' => $unitCost,
                    'total_cost' => $unitCost * $item['quantity_ordered'],
                ]);
            }

            return $po;
        });

        $po->load(['supplier', 'items.product']);

        return (new PurchaseOrderResource($po))->response()->setStatusCode(201);
    }

    public function update(UpdatePurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): JsonResponse|PurchaseOrderResource
    {
        $data = $request->validated();

        // Enforce forward-only status transitions (draft → ordered → received).
        if (isset($data['status']) && $data['status'] !== $purchaseOrder->status) {
            $allowed = PurchaseOrder::VALID_TRANSITIONS[$purchaseOrder->status] ?? [];

            if (! in_array($data['status'], $allowed, true)) {
                return response()->json([
                    'message' => "Cannot transition PO from '{$purchaseOrder->status}' to '{$data['status']}'.",
                    'errors' => ['status' => ['Invalid status transition.']],
                ], 422);
            }
        }

        $purchaseOrder->update($data);
        $purchaseOrder->load(['supplier', 'items.product']);

        return new PurchaseOrderResource($purchaseOrder);
    }

    public function destroy(DestroyPurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->delete();

        return response()->noContent();
    }

    /**
     * Record physical receipt against a PO (FR-41).
     * Appends RECEIPT inventory_transactions and transitions the PO to received
     * when all items are fully fulfilled.
     */
    public function receive(ReceivePurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        if ($purchaseOrder->status === 'received') {
            return response()->json([
                'message' => 'This purchase order has already been fully received.',
            ], 422);
        }

        $result = DB::transaction(function () use ($request, $purchaseOrder): PurchaseOrder {
            foreach ($request->validated()['items'] as $incoming) {
                $item = $purchaseOrder->items()
                    ->where('sku_id', $incoming['sku_id'])
                    ->first();

                // If no lot_id supplied, create a minimal lot for this receipt.
                $lotId = $incoming['lot_id'] ?? null;

                if ($lotId === null) {
                    $lot = Lot::create([
                        'sku_id' => $incoming['sku_id'],
                        'received_date' => now(),
                        'bin_location' => 'RECEIVING',
                    ]);
                    $lotId = $lot->lot_id;
                }

                $this->transactionService->record([
                    'lot_id' => $lotId,
                    'txn_type' => 'RECEIPT',
                    'qty_delta' => $incoming['qty_received'],
                    'occurred_at' => now(),
                ], $request->user()->id);

                if ($item !== null) {
                    $item->increment('quantity_received', $incoming['qty_received']);
                }
            }

            if ($purchaseOrder->isFullyReceived()) {
                $purchaseOrder->update(['status' => 'received']);
            }

            return $purchaseOrder->fresh(['supplier', 'items.product']);
        });

        return (new PurchaseOrderResource($result))->response();
    }
}
