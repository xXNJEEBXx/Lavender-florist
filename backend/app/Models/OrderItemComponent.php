<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItemComponent extends Model
{
    public $timestamps = false;
    protected $table = 'order_item_components';
    protected $fillable = ['order_item_id', 'component_id', 'quantity', 'status'];

    public function orderItem()  { return $this->belongsTo(OrderItem::class); }
    public function component()  { return $this->belongsTo(Component::class); }
}
