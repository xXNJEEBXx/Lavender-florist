<?php

namespace App\Utils;

class PhoneUtils
{
    /**
     * Normalize phone number to standard Saudi format: 05XXXXXXXX
     * Removes spaces, '+', '00', '966', and adds leading '05' if missing.
     *
     * @param string|null $phone
     * @return string|null
     */
    public static function normalize(?string $phone): ?string
    {
        if (empty($phone)) {
            return null;
        }

        // Remove all non-numeric characters except '+'
        $phone = preg_replace('/[^\d+]/', '', $phone);

        // Remove '+' or '00' prefix
        if (str_starts_with($phone, '+')) {
            $phone = substr($phone, 1);
        } elseif (str_starts_with($phone, '00')) {
            $phone = substr($phone, 2);
        }

        // Remove country code '966' if present
        if (str_starts_with($phone, '966')) {
            $phone = substr($phone, 3);
        }

        // Add leading '0' if the number starts with '5'
        if (str_starts_with($phone, '5')) {
            $phone = '0' . $phone;
        }

        return $phone;
    }
}
