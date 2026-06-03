<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ActivityLog;

class ActivityLogController extends Controller
{
    /**
     * Get the latest activity logs for the admin dashboard.
     */
    public function index()
    {
        $logs = ActivityLog::with('actor')
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        return response()->json($logs);
    }
}
