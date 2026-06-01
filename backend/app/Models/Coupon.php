<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code', 'name', 'description', 'type', 'value', 'min_order_amount',
        'max_discount_amount', 'applicable_products', 'applicable_categories',
        'usage_limit', 'usage_per_customer', 'times_used', 'starts_at', 'expires_at', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value'                => 'decimal:2',
            'min_order_amount'     => 'decimal:2',
            'max_discount_amount'  => 'decimal:2',
            'applicable_products'  => 'array',
            'applicable_categories'=> 'array',
            'starts_at'            => 'datetime',
            'expires_at'           => 'datetime',
            'is_active'            => 'boolean',
        ];
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(fn($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>=', now()));
    }

    public function getIsValidAttribute(): bool
    {
        if (!$this->is_active) return false;
        if ($this->starts_at && $this->starts_at->isFuture()) return false;
        if ($this->expires_at && $this->expires_at->isPast()) return false;
        if ($this->usage_limit && $this->times_used >= $this->usage_limit) return false;
        return true;
    }

    public function usages()  { return $this->hasMany(CouponUsage::class); }
    public function orders()  { return $this->hasMany(Order::class); }
}
