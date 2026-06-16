<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    protected $fillable = ['cart_id', 'product_id', 'quantity', 'parent_id', 'options'];

    protected $casts = [
        'options' => 'array',
    ];

    public function cart()    { return $this->belongsTo(Cart::class); }
    public function product() { return $this->belongsTo(Product::class); }
    public function parent()  { return $this->belongsTo(CartItem::class, 'parent_id'); }
    public function addons()  { return $this->hasMany(CartItem::class, 'parent_id'); }

    public function getSubtotalAttribute(): float
    {
        $base = $this->product->price * $this->quantity;
        $addonsTotal = $this->addons->sum('subtotal');
        return $base + $addonsTotal;
    }
}
