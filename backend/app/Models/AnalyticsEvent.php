<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsEvent extends Model
{
    public $timestamps = false;
    protected $fillable = ['event_type', 'user_id', 'page', 'data', 'session_id', 'ip_address', 'user_agent'];

    protected function casts(): array
    {
        return [
            'data'       => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user() { return $this->belongsTo(User::class); }
}
