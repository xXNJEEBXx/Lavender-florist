<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = $request->user()->addresses->map(function ($address) {
            $arr = $address->toArray();
            $arr['name'] = $address->label;
            $arr['street_address'] = $address->street;
            return $arr;
        });
        return response()->json($addresses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'recipient_name' => 'nullable|string|max:255',
            'recipient_phone' => 'required|string|max:20',
            'city' => 'required|string|max:100',
            'street_address' => 'required|string|max:255',
            'is_default' => 'boolean',
            'delivery_notes' => 'nullable|string|max:1000',
            'door_image' => 'nullable|image|max:5120',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'google_maps_link' => 'nullable|string|max:1000',
        ]);

        $doorImagePath = null;
        if ($request->hasFile('door_image')) {
            $path = $request->file('door_image')->store('addresses', 'public');
            $doorImagePath = '/storage/' . $path;
        }

        $addressData = [
            'user_id' => $request->user()->id,
            'label' => $validated['name'],
            'recipient_name' => $validated['recipient_name'],
            'recipient_phone' => $validated['recipient_phone'],
            'city' => $validated['city'],
            'street' => $validated['street_address'],
            'delivery_notes' => $validated['delivery_notes'] ?? null,
            'door_image_path' => $doorImagePath,
            'is_default' => $validated['is_default'] ?? false,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'google_maps_link' => $validated['google_maps_link'] ?? null,
        ];

        // If this is set as default, unset others
        if (!empty($validated['is_default'])) {
            $request->user()->addresses()->update(['is_default' => false]);
        }

        $address = Address::create($addressData);

        $arr = $address->toArray();
        $arr['name'] = $address->label;
        $arr['street_address'] = $address->street;

        return response()->json($arr, 201);
    }
    public function update(Request $request, Address $address)
    {
        if ($address->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'recipient_name' => 'nullable|string|max:255',
            'recipient_phone' => 'required|string|max:20',
            'city' => 'required|string|max:100',
            'street_address' => 'required|string|max:255',
            'is_default' => 'boolean',
            'delivery_notes' => 'nullable|string|max:1000',
            'door_image' => 'nullable|image|max:5120',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'google_maps_link' => 'nullable|string|max:1000',
        ]);

        $doorImagePath = $address->door_image_path;
        if ($request->hasFile('door_image')) {
            $path = $request->file('door_image')->store('addresses', 'public');
            $doorImagePath = '/storage/' . $path;
        }

        $addressData = [
            'label' => $validated['name'],
            'recipient_name' => $validated['recipient_name'],
            'recipient_phone' => $validated['recipient_phone'],
            'city' => $validated['city'],
            'street' => $validated['street_address'],
            'delivery_notes' => $validated['delivery_notes'] ?? null,
            'door_image_path' => $doorImagePath,
            'is_default' => $validated['is_default'] ?? false,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'google_maps_link' => $validated['google_maps_link'] ?? null,
        ];

        if (!empty($validated['is_default'])) {
            $request->user()->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        $address->update($addressData);

        $arr = $address->toArray();
        $arr['name'] = $address->label;
        $arr['street_address'] = $address->street;

        return response()->json($arr);
    }

    public function destroy(Request $request, Address $address)
    {
        if ($address->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $address->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function expandUrl(Request $request)
    {
        $url = $request->input('url');
        if (!$url) {
            return response()->json(['error' => 'No URL'], 400);
        }

        // Use cURL to get the final redirected URL
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_NOBODY, true); // we only need headers/redirects
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_exec($ch);
        $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
        curl_close($ch);

        // The final URL usually looks like https://www.google.com/maps/place/.../@25.123,49.123,15z
        if (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $finalUrl, $matches)) {
            return response()->json([
                'latitude' => $matches[1],
                'longitude' => $matches[2],
                'final_url' => $finalUrl
            ]);
        }
        
        // try another format: =25.123,49.123
        if (preg_match('/=(-?\d+\.\d+),(-?\d+\.\d+)/', $finalUrl, $matches)) {
            return response()->json([
                'latitude' => $matches[1],
                'longitude' => $matches[2],
                'final_url' => $finalUrl
            ]);
        }

        return response()->json(['error' => 'Coordinates not found in URL', 'final_url' => $finalUrl], 404);
    }
}
