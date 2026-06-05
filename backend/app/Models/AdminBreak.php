<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminBreak extends Model
{
    protected $fillable = ['start_at', 'end_at', 'reason', 'created_by'];

    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
