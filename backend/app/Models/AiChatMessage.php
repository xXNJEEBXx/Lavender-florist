<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiChatMessage extends Model
{
    protected $table = 'ai_chat_messages';
    protected $fillable = ['session_id', 'role', 'content', 'images', 'tool_calls', 'tool_results'];

    protected function casts(): array
    {
        return [
            'images'       => 'array',
            'tool_calls'   => 'array',
            'tool_results' => 'array',
        ];
    }

    public function session() { return $this->belongsTo(AiChatSession::class, 'session_id'); }
}
