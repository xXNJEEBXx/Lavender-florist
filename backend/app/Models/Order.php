<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number', 'customer_id', 'status', 'delivery_type', 'delivery_speed',
        'address_id', 'delivery_date', 'delivery_time_slot', 'delivery_fee',
        'delivery_minutes', 'driver_id', 'delivery_offered_at', 'scheduled_at', 'ready_by',
        'estimated_delivery_at', 'driver_notes', 'subtotal', 'discount',
        'coupon_id', 'total', 'payment_method', 'payment_status',
        'bank_transfer_receipt', 'notes', 'estimated_preparation_time',
        'queue_position', 'confirmed_at', 'preparing_at', 'ready_at',
        'delivering_at', 'delivered_at', 'cancelled_at', 'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'delivery_date'        => 'date',
            'estimated_delivery_at'=> 'datetime',
            'confirmed_at'         => 'datetime',
            'preparing_at'         => 'datetime',
            'ready_at'             => 'datetime',
            'delivering_at'        => 'datetime',
            'delivered_at'         => 'datetime',
            'cancelled_at'         => 'datetime',
            'delivery_offered_at'  => 'datetime',
            'scheduled_at'         => 'datetime',
            'ready_by'             => 'datetime',
            'subtotal'             => 'decimal:2',
            'discount'             => 'decimal:2',
            'delivery_fee'         => 'decimal:2',
            'total'                => 'decimal:2',
        ];
    }

    // Scopes
    public function scopeStatus($query, $status) { return $query->where('status', $status); }
    public function scopePending($query)    { return $query->where('status', 'pending'); }
    public function scopeActive($query)     { return $query->whereNotIn('status', ['delivered', 'cancelled']); }

    // Relationships
    public function customer()       { return $this->belongsTo(User::class, 'customer_id'); }
    public function address()        { return $this->belongsTo(Address::class); }
    public function driver()         { return $this->belongsTo(Driver::class); }
    public function coupon()         { return $this->belongsTo(Coupon::class); }
    public function items()          { return $this->hasMany(OrderItem::class); }
    public function statusHistory()  { return $this->hasMany(OrderStatusHistory::class); }
    public function giftMessage()    { return $this->hasOne(GiftMessage::class); }
}
