<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    public function getTelegram(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'telegram_username' => $user->telegram_username,
            'telegram_chat_id' => $user->telegram_chat_id,
            'is_connected' => !empty($user->telegram_chat_id),
            'telegram_notify_new_orders' => $user->telegram_notify_new_orders ?? true,
            'telegram_notify_driver' => $user->telegram_notify_driver ?? false,
            'telegram_notify_website' => $user->telegram_notify_website ?? true,
        ]);
    }

    public function updateTelegram(Request $request)
    {
        $validated = $request->validate([
            'telegram_username' => 'nullable|string|max:100',
            'telegram_notify_new_orders' => 'boolean',
            'telegram_notify_driver' => 'boolean',
            'telegram_notify_website' => 'boolean',
        ]);

        $user = $request->user();
        
        // Clean up username (remove @ if provided)
        if (isset($validated['telegram_username'])) {
            $username = trim($validated['telegram_username']);
            $username = ltrim($username, '@');
            $validated['telegram_username'] = $username ?: null;
            
            // If username changed, reset chat_id so user needs to /start again
            if ($user->telegram_username !== $validated['telegram_username']) {
                $validated['telegram_chat_id'] = null;
            }
        }

        $user->update($validated);

        return response()->json([
            'message' => 'تم تحديث الإعدادات بنجاح',
            'telegram_username' => $user->telegram_username,
            'telegram_chat_id' => $user->telegram_chat_id,
            'is_connected' => !empty($user->telegram_chat_id),
            'telegram_notify_new_orders' => $user->telegram_notify_new_orders,
            'telegram_notify_driver' => $user->telegram_notify_driver,
            'telegram_notify_website' => $user->telegram_notify_website,
        ]);
    }

    public function getPublicSettings()
    {
        return response()->json([
            'enable_door_image_discount' => filter_var(\App\Models\StoreSetting::getSetting('enable_door_image_discount', 'true'), FILTER_VALIDATE_BOOLEAN),
        ]);
    }

    public function getStoreSettings()
    {
        return response()->json([
            'enable_door_image_discount' => filter_var(\App\Models\StoreSetting::getSetting('enable_door_image_discount', 'true'), FILTER_VALIDATE_BOOLEAN),
            'store_bears_door_discount' => filter_var(\App\Models\StoreSetting::getSetting('store_bears_door_discount', 'true'), FILTER_VALIDATE_BOOLEAN),
            'store_bears_delivery_coupon' => filter_var(\App\Models\StoreSetting::getSetting('store_bears_delivery_coupon', 'true'), FILTER_VALIDATE_BOOLEAN),
        ]);
    }

    public function updateStoreSettings(Request $request)
    {
        $validated = $request->validate([
            'enable_door_image_discount' => 'boolean',
            'store_bears_door_discount' => 'boolean',
            'store_bears_delivery_coupon' => 'boolean',
        ]);

        if (isset($validated['enable_door_image_discount'])) {
            \App\Models\StoreSetting::setSetting('enable_door_image_discount', $validated['enable_door_image_discount'] ? 'true' : 'false');
        }
        if (isset($validated['store_bears_door_discount'])) {
            \App\Models\StoreSetting::setSetting('store_bears_door_discount', $validated['store_bears_door_discount'] ? 'true' : 'false');
        }
        if (isset($validated['store_bears_delivery_coupon'])) {
            \App\Models\StoreSetting::setSetting('store_bears_delivery_coupon', $validated['store_bears_delivery_coupon'] ? 'true' : 'false');
        }

        return response()->json(['message' => 'تم حفظ إعدادات المتجر بنجاح']);
    }
}
