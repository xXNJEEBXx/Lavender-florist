<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Component;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        Carbon::setLocale('ar');
        $now = Carbon::now('Asia/Riyadh');
        $sevenDaysAgo = $now->copy()->subDays(7);
        $fourteenDaysAgo = $now->copy()->subDays(14);

        $validStatuses = ['confirmed', 'preparing', 'ready', 'delivering', 'delivered'];

        // --- 1. Total Sales ---
        $currentSales = Order::whereIn('status', $validStatuses)
            ->where('created_at', '>=', $sevenDaysAgo)
            ->sum('total');

        $previousSales = Order::whereIn('status', $validStatuses)
            ->whereBetween('created_at', [$fourteenDaysAgo, $sevenDaysAgo])
            ->sum('total');

        $salesTrend = $this->calculateTrend($currentSales, $previousSales);

        // --- 2. New Orders ---
        $currentOrders = Order::where('created_at', '>=', $sevenDaysAgo)->count();
        $previousOrders = Order::whereBetween('created_at', [$fourteenDaysAgo, $sevenDaysAgo])->count();
        $ordersTrend = $this->calculateTrend($currentOrders, $previousOrders);

        // --- 3. Customers ---
        $currentCustomers = User::where('role', 'customer')
            ->where('created_at', '>=', $sevenDaysAgo)
            ->count();
        $previousCustomers = User::where('role', 'customer')
            ->whereBetween('created_at', [$fourteenDaysAgo, $sevenDaysAgo])
            ->count();
        $customersTrend = $this->calculateTrend($currentCustomers, $previousCustomers);

        $totalCustomersCount = User::where('role', 'customer')->count();
        
        // --- 4. Active Products ---
        $activeProductsCount = Product::where('is_active', true)->count();
        $productsTrend = '+0%'; // Static as it doesn't fluctuate weekly typically

        // --- 5. Sales Chart Data (Last 7 Days) ---
        $salesData = [];
        $arabicDays = [
            'Saturday' => 'السبت',
            'Sunday' => 'الأحد',
            'Monday' => 'الإثنين',
            'Tuesday' => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday' => 'الخميس',
            'Friday' => 'الجمعة'
        ];

        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();

            $daySales = Order::whereIn('status', $validStatuses)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->sum('total');

            $salesData[] = [
                'name' => $arabicDays[$date->format('l')],
                'sales' => (float)$daySales
            ];
        }

        // --- 6. Components Stock (Low Inventory Alert) ---
        $componentsStockRaw = Component::whereColumn('stock_quantity', '<=', 'min_stock_alert')
            ->orderBy('stock_quantity', 'asc')
            ->take(6)
            ->get();

        $componentsStock = $componentsStockRaw->map(function ($comp) {
            $status = 'good';
            if ($comp->stock_quantity <= 0 || $comp->stock_quantity <= ($comp->min_stock_alert / 2)) {
                $status = 'critical';
            } elseif ($comp->stock_quantity <= $comp->min_stock_alert) {
                $status = 'low';
            }

            return [
                'name' => $comp->name,
                'stock' => $comp->stock_quantity,
                'min' => $comp->min_stock_alert,
                'unit' => $comp->unit,
                'status' => $status
            ];
        });

        // --- 7. Recent Orders ---
        $recentOrdersRaw = Order::with('customer')
            ->latest()
            ->take(5)
            ->get();

        $statusArabic = [
            'pending' => 'بانتظار التأكيد',
            'confirmed' => 'مؤكد',
            'preparing' => 'قيد التجهيز',
            'ready' => 'جاهز',
            'delivering' => 'قيد التوصيل',
            'delivered' => 'مكتمل',
            'cancelled' => 'ملغي'
        ];

        $recentOrders = $recentOrdersRaw->map(function ($order) use ($statusArabic) {
            return [
                'id' => $order->order_number ?? ('#ORD-' . $order->id),
                'customer' => $order->owner_name ?: ($order->customer ? $order->customer->name : 'زائر'),
                'date' => $order->created_at->diffForHumans(),
                'total' => number_format($order->total, 2) . ' ر.س',
                'status' => $statusArabic[$order->status] ?? $order->status
            ];
        });

        return response()->json([
            'stats' => [
                'sales' => [
                    'value' => number_format($currentSales, 2) . ' ر.س',
                    'trend' => ($salesTrend > 0 ? '+' : '') . $salesTrend . '%'
                ],
                'orders' => [
                    'value' => (string)$currentOrders,
                    'trend' => ($ordersTrend > 0 ? '+' : '') . $ordersTrend . '%'
                ],
                'customers' => [
                    'value' => number_format($totalCustomersCount),
                    'trend' => ($customersTrend > 0 ? '+' : '') . $customersTrend . '%'
                ],
                'products' => [
                    'value' => (string)$activeProductsCount,
                    'trend' => $productsTrend
                ]
            ],
            'salesData' => $salesData,
            'componentsStock' => $componentsStock,
            'recentOrders' => $recentOrders
        ]);
    }

    private function calculateTrend($current, $previous)
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }
        $trend = (($current - $previous) / $previous) * 100;
        return round($trend, 1);
    }
}
