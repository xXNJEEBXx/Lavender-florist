<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    use HasFactory;
    protected $fillable = ['user_id', 'label', 'recipient_name', 'recipient_phone', 'city', 'district', 'street', 'building', 'notes', 'is_default'];

    protected function casts(): array
    {
        return ['is_default' => 'boolean'];
    }

    public function user() { return $this->belongsTo(User::class); }
}
