<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiChatSession extends Model
{
    protected $table = 'ai_chat_sessions';
    protected $fillable = ['user_id', 'title', 'is_active'];
    protected function casts(): array { return ['is_active' => 'boolean']; }

    public function user()     { return $this->belongsTo(User::class); }
    public function messages() { return $this->hasMany(AiChatMessage::class, 'session_id'); }
}
