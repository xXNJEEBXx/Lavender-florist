<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    public $timestamps = false;
    protected $table = 'activity_logs';

    protected $fillable = [
        'event_type', 'actor_type', 'actor_id', 'subject_type', 'subject_id',
        'description', 'metadata', 'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'metadata'   => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function actor()   { return $this->belongsTo(User::class, 'actor_id'); }
    public function subject() { return $this->morphTo(); }
}
