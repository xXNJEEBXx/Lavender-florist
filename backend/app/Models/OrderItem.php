<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = ['order_id', 'product_id', 'product_name', 'quantity', 'unit_price', 'total_price', 'parent_id', 'options'];

    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2', 'total_price' => 'decimal:2', 'options' => 'array'];
    }

    public function order()      { return $this->belongsTo(Order::class); }
    public function product()    { return $this->belongsTo(Product::class); }
    public function parent()     { return $this->belongsTo(OrderItem::class, 'parent_id'); }
    public function addons()     { return $this->hasMany(OrderItem::class, 'parent_id'); }
    public function components()
    {
        return $this->hasMany(OrderItemComponent::class);
    }

    public function giftMessage()
    {
        return $this->hasOne(GiftMessage::class);
    }
}
