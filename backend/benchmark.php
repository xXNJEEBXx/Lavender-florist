<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$start = microtime(true);
$count = \App\Models\Order::count();
$end = microtime(true);
echo "Order Count Query: " . round(($end - $start) * 1000, 2) . " ms (Count: $count)\n";

$start = microtime(true);
$orders = \App\Models\Order::with(['items', 'customer'])->limit(50)->get();
$end = microtime(true);
echo "Complex Order Query (with relations): " . round(($end - $start) * 1000, 2) . " ms\n";

$start = microtime(true);
$products = \App\Models\Product::with('primaryImage')->limit(50)->get();
$end = microtime(true);
echo "Products Query: " . round(($end - $start) * 1000, 2) . " ms\n";
