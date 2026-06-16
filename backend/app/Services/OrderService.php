<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Component;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\OrderItem;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\TelegramWebhookController; // We will refactor this later or use TelegramService

class OrderService
{
    /**
     * Process order items, calculate subtotal, and determine required components.
     *
     * @param array $items Array of items (product_id, quantity, gift_message)
     * @return array [subtotal, orderItemsData, componentsToDeduct]
     */
    public function processOrderItems(array $items): array
    {
        $subtotal = 0;
        $orderItemsData = [];
        $componentsToDeduct = [];
        $totalPreparationTime = 0;

        foreach ($items as $item) {
            $product = Product::with('components')->findOrFail($item['product_id']);
            $unitPrice = $product->price;
            $totalPrice = $unitPrice * $item['quantity'];
            $subtotal += $totalPrice;
            $totalPreparationTime += ($product->preparation_time_minutes ?? 0) * $item['quantity'];

            $mainItemData = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => $item['quantity'],
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
                'options' => $item['options'] ?? null,
                'addons' => []
            ];

            foreach ($product->components as $component) {
                $neededQuantity = $component->pivot->quantity * $item['quantity'];
                if (!isset($componentsToDeduct[$component->id])) {
                    $componentsToDeduct[$component->id] = 0;
                }
                $componentsToDeduct[$component->id] += $neededQuantity;
            }

            // Process addons
            if (!empty($item['addons']) && is_array($item['addons'])) {
                foreach ($item['addons'] as $addon) {
                    $addonProduct = Product::with('components')->findOrFail($addon['product_id']);
                    $addonUnitPrice = $addonProduct->price;
                    $addonTotalPrice = $addonUnitPrice * $addon['quantity'];
                    $subtotal += $addonTotalPrice;
                    $totalPreparationTime += ($addonProduct->preparation_time_minutes ?? 0) * $addon['quantity'];

                    $mainItemData['addons'][] = [
                        'product_id' => $addonProduct->id,
                        'product_name' => $addonProduct->name,
                        'quantity' => $addon['quantity'],
                        'unit_price' => $addonUnitPrice,
                        'total_price' => $addonTotalPrice,
                        'options' => $addon['options'] ?? null,
                    ];

                    foreach ($addonProduct->components as $component) {
                        $neededQuantity = $component->pivot->quantity * $addon['quantity'];
                        if (!isset($componentsToDeduct[$component->id])) {
                            $componentsToDeduct[$component->id] = 0;
                        }
                        $componentsToDeduct[$component->id] += $neededQuantity;
                    }
                }
            }

            $orderItemsData[] = $mainItemData;
        }

        return [$subtotal, $orderItemsData, $componentsToDeduct, $totalPreparationTime];
    }

    /**
     * Validate if the required components are available in stock.
     */
    public function validateStock(array $componentsToDeduct): void
    {
        foreach ($componentsToDeduct as $componentId => $qtyToDeduct) {
            $component = Component::find($componentId);
            if (!$component || $component->stock_quantity < $qtyToDeduct) {
                throw ValidationException::withMessages([
                    'items' => 'عذراً، الكمية المطلوبة من بعض المنتجات لم تعد متوفرة في المخزون.'
                ]);
            }
        }
    }

    /**
     * Deduct stock for the components.
     */
    public function deductStock(array $componentsToDeduct, $performerId = null, string $orderNumber = ''): void
    {
        foreach ($componentsToDeduct as $componentId => $qtyToDeduct) {
            $component = Component::find($componentId);
            if ($component) {
                $component->decrement('stock_quantity', $qtyToDeduct);
                
                // Create stock log
                DB::table('component_stock_logs')->insert([
                    'component_id' => $componentId,
                    'performed_by' => $performerId,
                    'type' => 'consumption',
                    'quantity' => -$qtyToDeduct,
                    'stock_after' => $component->stock_quantity,
                    'notes' => 'Consumed for order ' . $orderNumber,
                    'created_at' => now()
                ]);
            }
        }
    }

    /**
     * Save order items and gift messages.
     */
    public function saveOrderItems(Order $order, array $orderItemsData, string $senderName = 'مسودة'): void
    {
        foreach ($orderItemsData as $itemData) {
            $addons = $itemData['addons'] ?? [];
            unset($itemData['addons']);
            
            $itemData['order_id'] = $order->id;
            $orderItem = OrderItem::create($itemData);

            if (!empty($addons)) {
                foreach ($addons as $addonData) {
                    $addonData['order_id'] = $order->id;
                    $addonData['parent_id'] = $orderItem->id;
                    OrderItem::create($addonData);
                }
            }
        }
    }

    /**
     * Determine the scheduling dates.
     */
    public function determineScheduling(string $deliveryType, ?string $scheduledDate, ?string $scheduledTime): array
    {
        $scheduledAt = null;
        $readyBy = null;
        if (!empty($scheduledDate) && !empty($scheduledTime)) {
            $scheduledAt = \Carbon\Carbon::parse($scheduledDate . ' ' . $scheduledTime);
            if ($deliveryType === 'local') {
                $readyBy = $scheduledAt->copy()->subMinutes(30);
            } else {
                $readyBy = $scheduledAt->copy();
            }
        }
        return [$scheduledAt, $readyBy];
    }

    /**
     * Calculate and apply coupon discount.
     *
     * @return array [discountAmount, couponId, finalDeliveryFee]
     */
    public function applyCoupon(?string $couponCode, float $subtotal, float $deliveryFee, $customerId): array
    {
        $discount = 0;
        $couponId = null;
        $finalDeliveryFee = $deliveryFee;

        if (empty($couponCode)) {
            return [$discount, $couponId, $finalDeliveryFee];
        }

        $coupon = Coupon::where('code', $couponCode)->first();
        if ($coupon && $coupon->is_valid) {
            if (!$coupon->min_order_amount || $subtotal >= $coupon->min_order_amount) {
                $user_usages = CouponUsage::where('coupon_id', $coupon->id)->where('user_id', $customerId)->count();
                if ($user_usages < $coupon->usage_per_customer) {
                    $couponId = $coupon->id;
                    if ($coupon->type === 'fixed') {
                        $discount = min($coupon->value, $subtotal);
                    } elseif ($coupon->type === 'percentage') {
                        $discount = ($subtotal * $coupon->value) / 100;
                        if ($coupon->max_discount_amount && $discount > $coupon->max_discount_amount) {
                            $discount = $coupon->max_discount_amount;
                        }
                    } elseif ($coupon->type === 'free_delivery') {
                        $finalDeliveryFee = 0;
                    } elseif ($coupon->type === 'delivery_discount') {
                        if ($coupon->value > 0) {
                            $finalDeliveryFee = max(0, $finalDeliveryFee - $coupon->value);
                        } else {
                            $finalDeliveryFee = 0;
                        }
                    }
                }
            }
        }

        return [$discount, $couponId, $finalDeliveryFee];
    }

    /**
     * Calculate Driver Fee based on Store Settings.
     */
    public function calculateDriverFee(float $frontendDeliveryFee, float $finalDeliveryFee, float $originalFee): float
    {
        $storeBearsDoorDiscount = filter_var(\App\Models\StoreSetting::getSetting('store_bears_door_discount', 'true'), FILTER_VALIDATE_BOOLEAN);
        $storeBearsDeliveryCoupon = filter_var(\App\Models\StoreSetting::getSetting('store_bears_delivery_coupon', 'true'), FILTER_VALIDATE_BOOLEAN);

        $driverFee = $originalFee;
        if (!$storeBearsDoorDiscount) {
            $driverFee -= max(0, $originalFee - $frontendDeliveryFee);
        }
        if (!$storeBearsDeliveryCoupon) {
            $driverFee -= max(0, $frontendDeliveryFee - $finalDeliveryFee);
        }
        return max(0, $driverFee);
    }

    /**
     * Calculate Original Fee (fallback).
     */
    public function calculateOriginalFee(string $deliveryType, ?int $deliveryMinutes, string $deliverySpeed, float $frontendDeliveryFee): float
    {
        $backendCalculatedOriginalFee = 0;
        if ($deliveryType === 'local') {
            $mins = $deliveryMinutes ?? 0;
            if ($mins > 0) {
                if ($mins <= 6) $backendCalculatedOriginalFee = 15;
                elseif ($mins <= 10) $backendCalculatedOriginalFee = 20;
                elseif ($mins <= 13) $backendCalculatedOriginalFee = 25;
                elseif ($mins <= 15) $backendCalculatedOriginalFee = 30;
                elseif ($mins <= 27) $backendCalculatedOriginalFee = 35;
                elseif ($mins <= 37) $backendCalculatedOriginalFee = 40;
            }
            if ($deliverySpeed === 'express') {
                $backendCalculatedOriginalFee += 20;
            }
        }

        return max($frontendDeliveryFee, $backendCalculatedOriginalFee);
    }
}
