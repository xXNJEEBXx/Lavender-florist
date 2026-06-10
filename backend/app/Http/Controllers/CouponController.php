<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $coupons = Coupon::orderBy('created_at', 'desc')->get();
        return response()->json($coupons);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:coupons',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed,free_delivery,delivery_discount,product_discount,category_discount',
            'value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'applicable_products' => 'nullable|array',
            'applicable_categories' => 'nullable|array',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_per_customer' => 'required|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'boolean',
        ]);

        $coupon = Coupon::create($validated);

        return response()->json([
            'message' => 'تم إضافة الكوبون بنجاح',
            'coupon' => $coupon
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Coupon $coupon)
    {
        return response()->json($coupon);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Coupon $coupon)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:coupons,code,' . $coupon->id,
            'name' => 'required|string',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed,free_delivery,delivery_discount,product_discount,category_discount',
            'value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'applicable_products' => 'nullable|array',
            'applicable_categories' => 'nullable|array',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_per_customer' => 'required|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'boolean',
        ]);

        $coupon->update($validated);

        return response()->json([
            'message' => 'تم تحديث الكوبون بنجاح',
            'coupon' => $coupon
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Coupon $coupon)
    {
        $coupon->delete();

        return response()->json([
            'message' => 'تم حذف الكوبون بنجاح'
        ]);
    }

    /**
     * Validate a coupon for checkout
     */
    public function validateCoupon(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0'
        ]);

        $code = $request->code;
        $subtotal = $request->subtotal;

        $coupon = Coupon::where('code', $code)->first();

        if (!$coupon) {
            return response()->json(['message' => 'الكوبون غير صحيح'], 400);
        }

        if (!$coupon->is_valid) {
            return response()->json(['message' => 'الكوبون غير صالح أو منتهي الصلاحية'], 400);
        }

        // Check minimum order amount
        if ($coupon->min_order_amount && $subtotal < $coupon->min_order_amount) {
            return response()->json([
                'message' => 'الحد الأدنى للطلب لاستخدام هذا الكوبون هو ' . $coupon->min_order_amount . ' ر.س'
            ], 400);
        }

        // Check user usage limit if user is authenticated
        if (auth()->check()) {
            $user_usages = $coupon->usages()->where('user_id', auth()->id())->count();
            if ($user_usages >= $coupon->usage_per_customer) {
                return response()->json(['message' => 'لقد تجاوزت الحد الأقصى لاستخدام هذا الكوبون'], 400);
            }
        }

        // Calculate discount
        $discount = 0;
        if ($coupon->type === 'fixed') {
            $discount = $coupon->value;
            // Discount cannot exceed subtotal
            if ($discount > $subtotal) {
                $discount = $subtotal;
            }
        } elseif ($coupon->type === 'percentage') {
            $discount = ($subtotal * $coupon->value) / 100;
            // Apply max discount cap
            if ($coupon->max_discount_amount && $discount > $coupon->max_discount_amount) {
                $discount = $coupon->max_discount_amount;
            }
        } elseif ($coupon->type === 'free_delivery' || $coupon->type === 'delivery_discount') {
            // Handled separately on frontend/backend (Delivery becomes 0 or reduced)
            $discount = 0; // The discount is specifically for delivery fee
        }

        return response()->json([
            'message' => 'تم تطبيق الكوبون بنجاح',
            'coupon' => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->value,
                'discount_amount' => round($discount, 2)
            ]
        ]);
    }
}
