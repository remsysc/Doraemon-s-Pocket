<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\CycleCounts\StoreCycleCountRequest;
use App\Http\Resources\CycleCountResource;
use App\Models\CycleCount;
use App\Services\CycleCountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CycleCountController extends Controller
{
    /**
     * Display a listing of cycle counts.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = CycleCount::query()->with(['product', 'lot', 'countedBy']);

        // Authorization: WS can only see their own counts; Admin sees all
        if ($user->role !== 'admin') {
            $query->forUser($user->id);
        }

        // Optional filters
        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->has('flagged')) {
            if ($request->query('flagged') === 'true') {
                $query->flagged();
            } else {
                $query->notFlagged();
            }
        }
        if ($request->has('sku_id')) {
            $query->where('sku_id', $request->query('sku_id'));
        }

        $counts = $query->orderBy('counted_at', 'desc')->paginate(20);

        return response()->json(CycleCountResource::collection($counts)->response()->getData(true));
    }

    /**
     * Store a newly created cycle count.
     */
    public function store(StoreCycleCountRequest $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validated();
        $data['counted_by'] = $user->id;
        $data['counter_name'] = $user->name;

        $service = new CycleCountService;
        $count = $service->recordCount($data);

        return response()->json(new CycleCountResource($count), JsonResponse::HTTP_CREATED);
    }

    /**
     * Display the specified cycle count.
     */
    public function show(Request $request, CycleCount $cycleCount): JsonResponse
    {
        $user = $request->user();

        // Authorization: WS can only view their own counts; Admin sees all
        if ($user->role !== 'admin' && $cycleCount->counted_by !== $user->id) {
            abort(403, 'You do not have permission to view this cycle count.');
        }

        $cycleCount->load(['product', 'lot', 'countedBy', 'reconciledBy', 'reconciliationTransaction']);

        return response()->json(new CycleCountResource($cycleCount));
    }

    /**
     * Reconcile a cycle count.
     */
    public function reconcile(Request $request, CycleCount $cycleCount): JsonResponse
    {
        $user = $request->user();

        // Authorization: Admin only
        if ($user->role !== 'admin') {
            abort(403, 'Only admins can reconcile cycle counts.');
        }

        $service = new CycleCountService;
        $service->reconcile($cycleCount, $request->validate(['notes' => 'nullable|string|max:500']));

        return response()->json(new CycleCountResource($cycleCount->fresh()));
    }

    /**
     * Dismiss a cycle count.
     */
    public function dismiss(Request $request, CycleCount $cycleCount): JsonResponse
    {
        $user = $request->user();

        // Authorization: Admin only
        if ($user->role !== 'admin') {
            abort(403, 'Only admins can dismiss cycle counts.');
        }

        $validated = $request->validate(['notes' => 'required|string|max:500']);
        $service = new CycleCountService;
        $service->dismiss($cycleCount, $validated['notes']);

        return response()->json(new CycleCountResource($cycleCount->fresh()));
    }
}
