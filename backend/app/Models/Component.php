<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Component extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'name_en', 'category', 'color', 'image_url', 'unit',
        'cost_per_unit', 'stock_quantity', 'min_stock_alert', 'supplier', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'cost_per_unit'   => 'decimal:2',
            'stock_quantity'  => 'integer',
            'min_stock_alert' => 'integer',
            'is_active'       => 'boolean',
        ];
    }

    // Scopes
    public function scopeActive($query)    { return $query->where('is_active', true); }
    public function scopeLowStock($query)  { return $query->whereColumn('stock_quantity', '<=', 'min_stock_alert'); }
    public function scopeCategory($query, $cat) { return $query->where('category', $cat); }

    // Computed
    public function getIsLowStockAttribute(): bool
    {
        return $this->stock_quantity <= $this->min_stock_alert;
    }

    // Relationships
    public function products()    { return $this->belongsToMany(Product::class, 'product_components')->withPivot('quantity'); }
    public function stockLogs()   { return $this->hasMany(ComponentStockLog::class); }
}
