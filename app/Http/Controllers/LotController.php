<?php

namespace App\Http\Controllers;

use App\Models\Lot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LotController extends Controller
{
    /**
     * Display a listing of lots.
     */
    public function index(): JsonResponse
    {
        $lots = Lot::with('product')->get();

        return response()->json($lots);
    }

    /**
     * Store a newly created lot.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lot_id' => 'required|uuid|unique:lots,lot_id',
            'sku_id' => 'required|uuid|exists:products,sku_id',
            'received_date' => 'required|date',
            'expiry_date' => 'nullable|date|after_or_equal:received_date',
            'bin_location' => 'required|string|max:255',
        ]);

        $lot = Lot::create($validated);

        return response()->json($lot, 201);
    }

    /**
     * Display the specified lot.
     */
    public function show(Lot $lot): JsonResponse
    {
        return response()->json($lot->load('product'));
    }

    /**
     * Update the specified lot.
     */
    public function update(Request $request, Lot $lot): JsonResponse
    {
        $validated = $request->validate([
            'lot_id' => 'required|uuid|unique:lots,lot_id,' . $lot->lot_id,
            'sku_id' => 'required|uuid|exists:products,sku_id',
            'received_date' => 'required|date',
            'expiry_date' => 'nullable|date|after_or_equal:received_date',
            'bin_location' => 'required|string|max:255',
        ]);

        $lot->update($validated);

        return response()->json($lot);
    }

    /**
     * Remove the specified lot.
     */
    public function destroy(Lot $lot): JsonResponse
    {
        $lot->delete();

        return response()->json(null, 204);
    }
}
