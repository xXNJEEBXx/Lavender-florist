<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
        'auth_provider',
        'avatar_url',
        'is_active',
        'last_login_at',
        'google_id',
        'phone_otp',
        'phone_otp_expires_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'phone_otp',
        'phone_otp_expires_at',
        'google_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at'     => 'datetime',
            'phone_otp_expires_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    // Scopes
    public function scopeAdmins($query)   { return $query->where('role', 'admin'); }
    public function scopeCustomers($query){ return $query->where('role', 'customer'); }
    public function scopeActive($query)   { return $query->where('is_active', true); }

    // Checks
    public function isAdmin(): bool    { return $this->role === 'admin'; }
    public function isCustomer(): bool { return $this->role === 'customer'; }

    // Relationships
    public function addresses()        { return $this->hasMany(Address::class); }
    public function defaultAddress()   { return $this->hasOne(Address::class)->where('is_default', true); }
    public function orders()           { return $this->hasMany(Order::class, 'customer_id'); }
    public function cart()             { return $this->hasOne(Cart::class); }
    public function notifications()    { return $this->hasMany(Notification::class); }
    public function aiChatSessions()   { return $this->hasMany(AiChatSession::class); }
    public function mcpTokens()        { return $this->hasMany(McpToken::class); }
    public function activityLogs()     { return $this->hasMany(ActivityLog::class, 'actor_id'); }
}
