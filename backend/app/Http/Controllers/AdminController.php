<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $admins = User::where('role', 'admin')->get();
        return response()->json($admins);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|unique:users,phone',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:6',
            'is_active' => 'boolean'
        ]);

        if (empty($validated['phone']) && empty($validated['email'])) {
            return response()->json(['message' => 'يجب إدخال رقم الجوال أو البريد الإلكتروني'], 422);
        }

        $validated['role'] = 'admin';
        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = $validated['is_active'] ?? true;

        $admin = User::create($validated);

        return response()->json($admin, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $admin)
    {
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'المستخدم ليس مشرفاً'], 404);
        }
        return response()->json($admin);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $admin)
    {
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'المستخدم ليس مشرفاً'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => [
                'nullable',
                'string',
                Rule::unique('users')->ignore($admin->id),
            ],
            'email' => [
                'nullable',
                'email',
                Rule::unique('users')->ignore($admin->id),
            ],
            'password' => 'nullable|string|min:6',
            'is_active' => 'boolean'
        ]);

        if (array_key_exists('phone', $validated) && array_key_exists('email', $validated)) {
             if (empty($validated['phone']) && empty($validated['email'])) {
                return response()->json(['message' => 'يجب إدخال رقم الجوال أو البريد الإلكتروني'], 422);
             }
        } elseif (array_key_exists('phone', $validated) && empty($validated['phone']) && empty($admin->email)) {
            return response()->json(['message' => 'لا يمكن ترك الهاتف والبريد فارغين معاً'], 422);
        } elseif (array_key_exists('email', $validated) && empty($validated['email']) && empty($admin->phone)) {
            return response()->json(['message' => 'لا يمكن ترك الهاتف والبريد فارغين معاً'], 422);
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $admin->update($validated);

        return response()->json($admin);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, User $admin)
    {
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'المستخدم ليس مشرفاً'], 404);
        }

        if ($request->user()->id === $admin->id) {
            return response()->json(['message' => 'لا يمكنك حذف حسابك الخاص'], 403);
        }

        $admin->delete();

        return response()->json(['message' => 'تم الحذف بنجاح']);
    }
}
