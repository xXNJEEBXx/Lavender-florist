<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class McpToken extends Model
{
    protected $table = 'mcp_tokens';
    protected $fillable = ['user_id', 'name', 'token', 'abilities', 'last_used_at', 'expires_at'];

    protected function casts(): array
    {
        return [
            'abilities'    => 'array',
            'last_used_at' => 'datetime',
            'expires_at'   => 'datetime',
        ];
    }

    public function user() { return $this->belongsTo(User::class); }
}
