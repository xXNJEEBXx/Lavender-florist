<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkingHours extends Model
{
    protected $table = 'working_hours';
    protected $fillable = ['type', 'day_of_week', 'open_time', 'close_time', 'date', 'reason', 'is_active'];

    protected function casts(): array
    {
        return [
            'date'      => 'date',
            'is_active' => 'boolean',
        ];
    }
}
