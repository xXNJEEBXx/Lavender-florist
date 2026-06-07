<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DraftOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'token', 'customer_phone', 'customer_name', 'items', 
        'delivery_date', 'scheduled_time', 'delivery_type', 
        'delivery_speed', 'subtotal', 'status', 'expires_at'
    ];

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'delivery_date' => 'date',
            'subtotal' => 'decimal:2',
            'expires_at' => 'datetime',
        ];
    }
}
