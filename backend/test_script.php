<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

$validated = [
    'delivery_fee' => 0, 
    'coupon_code' => 'NJEEB3',
    'delivery_type' => 'local',
    'delivery_minutes' => 3,
    'delivery_speed' => 'standard'
];
$subtotal = 20;

$frontendDeliveryFee = $validated['delivery_fee'];

$backendCalculatedOriginalFee = 0;
if ($validated['delivery_type'] === 'local') {
    $mins = $validated['delivery_minutes'] ?? 0;
    if ($mins > 0) {
        if ($mins <= 6) $backendCalculatedOriginalFee = 15;
        elseif ($mins <= 10) $backendCalculatedOriginalFee = 20;
        elseif ($mins <= 13) $backendCalculatedOriginalFee = 25;
        elseif ($mins <= 15) $backendCalculatedOriginalFee = 30;
        elseif ($mins <= 27) $backendCalculatedOriginalFee = 35;
        elseif ($mins <= 37) $backendCalculatedOriginalFee = 40;
    }
    if (($validated['delivery_speed'] ?? 'standard') === 'express') {
        $backendCalculatedOriginalFee += 20;
    }
}

$originalFee = $validated['original_delivery_fee'] ?? max($frontendDeliveryFee, $backendCalculatedOriginalFee);

$coupon = \App\Models\Coupon::where('code', $validated['coupon_code'])->first();
if ($coupon && $coupon->is_valid) {
    if ($coupon->type === 'delivery_discount') {
        if ($coupon->value > 0) {
            $validated['delivery_fee'] = max(0, $validated['delivery_fee'] - $coupon->value);
        } else {
            $validated['delivery_fee'] = 0;
        }
    }
}

$finalDeliveryFee = $validated['delivery_fee'];

$storeBearsDoorDiscount = filter_var(\App\Models\StoreSetting::getSetting('store_bears_door_discount', 'true'), FILTER_VALIDATE_BOOLEAN);
$storeBearsDeliveryCoupon = filter_var(\App\Models\StoreSetting::getSetting('store_bears_delivery_coupon', 'true'), FILTER_VALIDATE_BOOLEAN);

$driverFee = $originalFee;
if (!$storeBearsDoorDiscount) {
    $driverFee -= max(0, $originalFee - $frontendDeliveryFee);
}
if (!$storeBearsDeliveryCoupon) {
    $driverFee -= max(0, $frontendDeliveryFee - $finalDeliveryFee);
}
$driverFee = max(0, $driverFee);

echo "Original Fee: " . $originalFee . "\n";
echo "Driver Fee: " . $driverFee . "\n";
