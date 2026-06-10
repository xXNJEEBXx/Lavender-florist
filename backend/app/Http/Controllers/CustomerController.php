<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Order;

class CustomerController extends Controller
{
    /**
     * Display a listing of the customers.
     */
    public function index(Request $request)
    {
        $query = User::where('role', 'customer')
            ->withCount('orders')
            ->withSum('orders', 'total');

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($customers);
    }

    /**
     * Display the specified customer.
     */
    public function show($id)
    {
        $customer = User::where('role', 'customer')
            ->with(['addresses', 'orders' => function ($query) {
                $query->orderBy('created_at', 'desc');
            }])
            ->withCount('orders')
            ->withSum('orders', 'total')
            ->findOrFail($id);

        return response()->json($customer);
    }

    /**
     * Toggle active status.
     */
    public function toggleActive($id)
    {
        $customer = User::where('role', 'customer')->findOrFail($id);
        $customer->is_active = !$customer->is_active;
        $customer->save();

        return response()->json([
            'message' => $customer->is_active ? 'تم تفعيل حساب العميل بنجاح' : 'تم إيقاف حساب العميل بنجاح',
            'is_active' => $customer->is_active
        ]);
    }
}
