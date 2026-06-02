<?php

namespace App\Http\Controllers;

use App\Models\Component;
use Illuminate\Http\Request;

class ComponentController extends Controller
{
    public function index()
    {
        return response()->json(Component::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'type' => 'required|string|max:100',
            'cost_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'is_active' => 'boolean'
        ]);

        $validated['is_active'] = filter_var($request->is_active ?? true, FILTER_VALIDATE_BOOLEAN);

        $component = Component::create($validated);
        return response()->json($component, 201);
    }

    public function show(Component $component)
    {
        return response()->json($component);
    }

    public function update(Request $request, Component $component)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'type' => 'sometimes|required|string|max:100',
            'cost_price' => 'sometimes|required|numeric|min:0',
            'stock_quantity' => 'sometimes|required|integer|min:0',
            'is_active' => 'nullable'
        ]);

        if ($request->has('is_active')) {
            $validated['is_active'] = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
        }

        $component->update($validated);
        return response()->json($component);
    }

    public function destroy(Component $component)
    {
        $component->delete();
        return response()->json(['message' => 'Component deleted successfully']);
    }
}
