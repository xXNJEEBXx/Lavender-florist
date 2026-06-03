<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    // GET /api/admin/products
    public function index(Request $request)
    {
        $products = Product::with(['primaryImage', 'components'])->orderBy('sort_order')->latest()->get();
        // Add calculated stock attribute dynamically for admin
        $products->each->append('calculated_stock');
        return response()->json($products);
    }

    // POST /api/admin/products
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'compare_at_price' => 'nullable|numeric|min:0',
            'occasion' => 'nullable|string|max:100',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'preparation_time_minutes' => 'nullable|integer',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'components' => 'nullable|string' // JSON string [{"id":1,"quantity":5}]
        ]);

        // Clean up boolean values if they come as strings from FormData
        $validated['is_featured'] = filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN);
        $validated['is_active'] = filter_var($request->is_active ?? true, FILTER_VALIDATE_BOOLEAN);

        $slugBase = $validated['name_en'] ?? $validated['name'];
        $slug = Str::slug($slugBase);
        $originalSlug = $slug;
        $counter = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $validated['slug'] = $slug;

        $product = Product::create($validated);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $file) {
                $path = $file->store('products', 'public');
                $product->images()->create([
                    'image_url' => '/storage/' . $path,
                    'is_primary' => $index === 0,
                    'sort_order' => $index + 1
                ]);
            }
        }

        if ($request->filled('components')) {
            $componentsData = json_decode($request->components, true);
            if (is_array($componentsData)) {
                $syncData = [];
                foreach ($componentsData as $comp) {
                    $syncData[$comp['id']] = ['quantity' => $comp['quantity']];
                }
                $product->components()->sync($syncData);
            }
        }

        $user = Auth::user();
        $actorName = $user ? $user->name : 'النظام';

        ActivityLog::create([
            'event_type' => 'created',
            'actor_type' => 'admin',
            'actor_id' => $user->id ?? 1,
            'subject_type' => Product::class,
            'subject_id' => $product->id,
            'description' => 'المشرف ' . $actorName . ' قام بإضافة منتج جديد: ' . $product->name,
            'ip_address' => $request->ip()
        ]);

        return response()->json($product->load(['primaryImage', 'components']), 201);
    }

    // GET /api/admin/products/{product}
    public function show(Product $product)
    {
        $product->append('calculated_stock');
        return response()->json($product->load(['images', 'components']));
    }

    // PUT/PATCH /api/admin/products/{product} (Use POST with _method=PUT from frontend)
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|required|string|max:100',
            'price' => 'sometimes|required|numeric|min:0',
            'compare_at_price' => 'nullable|numeric|min:0',
            'occasion' => 'nullable|string|max:100',
            'is_featured' => 'nullable',
            'is_active' => 'nullable',
            'preparation_time_minutes' => 'nullable|integer',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'components' => 'nullable|string'
        ]);

        if ($request->has('is_featured')) $validated['is_featured'] = filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN);
        if ($request->has('is_active')) $validated['is_active'] = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);

        $product->update($validated);

        if ($request->hasFile('images')) {
            // Delete old images from DB
            $product->images()->delete();

            foreach ($request->file('images') as $index => $file) {
                $path = $file->store('products', 'public');
                $product->images()->create([
                    'image_url' => '/storage/' . $path,
                    'is_primary' => $index === 0,
                    'sort_order' => $index + 1
                ]);
            }
        }

        if ($request->filled('components')) {
            $componentsData = json_decode($request->components, true);
            if (is_array($componentsData)) {
                $syncData = [];
                foreach ($componentsData as $comp) {
                    $syncData[$comp['id']] = ['quantity' => $comp['quantity']];
                }
                $product->components()->sync($syncData);
            }
        }

        $user = Auth::user();
        $actorName = $user ? $user->name : 'النظام';

        ActivityLog::create([
            'event_type' => 'updated',
            'actor_type' => 'admin',
            'actor_id' => $user->id ?? 1,
            'subject_type' => Product::class,
            'subject_id' => $product->id,
            'description' => 'المشرف ' . $actorName . ' قام بتعديل منتج: ' . $product->name,
            'ip_address' => $request->ip()
        ]);

        return response()->json($product->load(['primaryImage', 'components']));
    }

    // DELETE /api/admin/products/{product}
    public function destroy(Request $request, Product $product)
    {
        $productName = $product->name;
        $productId = $product->id;
        
        $product->delete();

        $user = Auth::user();
        $actorName = $user ? $user->name : 'النظام';

        ActivityLog::create([
            'event_type' => 'deleted',
            'actor_type' => 'admin',
            'actor_id' => $user->id ?? 1,
            'subject_type' => Product::class,
            'subject_id' => $productId,
            'description' => 'المشرف ' . $actorName . ' قام بحذف منتج: ' . $productName,
            'ip_address' => $request->ip()
        ]);

        return response()->json(['message' => 'Product deleted successfully']);
    }
}
