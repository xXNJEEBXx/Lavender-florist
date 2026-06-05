<?php

namespace App\Http\Controllers;

use App\Models\WorkingHours;
use Illuminate\Http\Request;

class WorkingHoursController extends Controller
{
    public function index()
    {
        return WorkingHours::orderBy('type')->orderBy('day_of_week')->orderBy('date')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:regular,closure,holiday',
            'day_of_week' => 'nullable|integer|min:0|max:6',
            'open_time' => 'nullable|string',
            'close_time' => 'nullable|string',
            'date' => 'nullable|date',
            'reason' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        // For regular type, ensure no duplicate day_of_week
        if ($validated['type'] === 'regular' && isset($validated['day_of_week'])) {
            WorkingHours::where('type', 'regular')
                ->where('day_of_week', $validated['day_of_week'])
                ->delete();
        }

        $wh = WorkingHours::create($validated);
        return response()->json($wh, 201);
    }

    public function update(Request $request, WorkingHours $working_hour)
    {
        $validated = $request->validate([
            'open_time' => 'nullable|string',
            'close_time' => 'nullable|string',
            'is_active' => 'boolean',
            'reason' => 'nullable|string|max:255',
        ]);

        $working_hour->update($validated);
        return response()->json($working_hour);
    }

    public function destroy(WorkingHours $working_hour)
    {
        $working_hour->delete();
        return response()->json(null, 204);
    }
}
