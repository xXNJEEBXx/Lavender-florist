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
            'recipient_name' => 'required|string|max:255',
            'recipient_phone' => 'required|string|max:20',
            'city' => 'required|string|max:100',
            'street_address' => 'required|string|max:255',
            'is_default' => 'boolean'
        ]);

        $addressData = [
            'user_id' => $request->user()->id,
            'label' => $validated['name'],
            'recipient_name' => $validated['recipient_name'],
            'recipient_phone' => $validated['recipient_phone'],
            'city' => $validated['city'],
            'street' => $validated['street_address'],
            'is_default' => $validated['is_default'] ?? false,
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
            'recipient_name' => 'required|string|max:255',
            'recipient_phone' => 'required|string|max:20',
            'city' => 'required|string|max:100',
            'street_address' => 'required|string|max:255',
            'is_default' => 'boolean'
        ]);

        $addressData = [
            'label' => $validated['name'],
            'recipient_name' => $validated['recipient_name'],
            'recipient_phone' => $validated['recipient_phone'],
            'city' => $validated['city'],
            'street' => $validated['street_address'],
            'is_default' => $validated['is_default'] ?? false,
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
}
