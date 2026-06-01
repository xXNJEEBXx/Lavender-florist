<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComponentStockLog extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'component_stock_logs';

    protected $fillable = [
        'component_id', 'type', 'quantity', 'stock_after',
        'reference_type', 'reference_id', 'notes', 'performed_by',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function component()   { return $this->belongsTo(Component::class); }
    public function reference()   { return $this->morphTo(); }
    public function performedBy() { return $this->belongsTo(User::class, 'performed_by'); }
}
