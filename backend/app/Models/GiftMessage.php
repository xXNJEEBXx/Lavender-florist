<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GiftMessage extends Model
{
    protected $fillable = ['order_id', 'order_item_id', 'sender_name', 'recipient_name', 'message', 'card_component_id'];

    public function order()         { return $this->belongsTo(Order::class); }
    public function orderItem()     { return $this->belongsTo(OrderItem::class); }
    public function cardComponent() { return $this->belongsTo(Component::class, 'card_component_id'); }
}
