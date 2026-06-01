<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'name_en', 'slug', 'description', 'category', 'price',
        'compare_at_price', 'occasion', 'tags', 'is_featured', 'is_active',
        'preparation_time_minutes', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price'            => 'decimal:2',
            'compare_at_price' => 'decimal:2',
            'tags'             => 'array',
            'is_featured'      => 'boolean',
            'is_active'        => 'boolean',
        ];
    }

    // Auto-generate slug
    protected static function booted(): void
    {
        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name_en ?? $product->name);
            }
        });
    }

    // Scopes
    public function scopeActive($query)   { return $query->where('is_active', true); }
    public function scopeFeatured($query) { return $query->where('is_featured', true); }
    public function scopeOrdered($query)  { return $query->orderBy('sort_order')->orderBy('created_at', 'desc'); }

    // Computed: available stock based on components
    public function getCalculatedStockAttribute(): int
    {
        if ($this->components->isEmpty()) return 0;

        return (int) $this->components->min(function ($component) {
            $required = $component->pivot->quantity;
            if ($required <= 0) return 0;
            return (int) floor($component->stock_quantity / $required);
        });
    }

    public function getIsInStockAttribute(): bool
    {
        return $this->calculated_stock > 0;
    }

    // Relationships
    public function components()   { return $this->belongsToMany(Component::class, 'product_components')->withPivot('quantity'); }
    public function images()       { return $this->hasMany(ProductImage::class)->orderBy('sort_order'); }
    public function primaryImage() { return $this->hasOne(ProductImage::class)->where('is_primary', true); }
    public function orderItems()   { return $this->hasMany(OrderItem::class); }
}
