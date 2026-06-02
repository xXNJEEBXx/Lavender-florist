<?php

namespace App\Http\Controllers;

use App\Models\Product;
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
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
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

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $product->images()->create([
                'image_url' => '/storage/' . $path,
                'is_primary' => true,
                'sort_order' => 1
            ]);
        }

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
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        if ($request->has('is_featured')) $validated['is_featured'] = filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN);
        if ($request->has('is_active')) $validated['is_active'] = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);

        $product->update($validated);

        if ($request->hasFile('image')) {
            $oldImage = $product->primaryImage;
            if ($oldImage) {
                // We could delete the physical file here
                $oldImage->delete();
            }

            $path = $request->file('image')->store('products', 'public');
            $product->images()->create([
                'image_url' => '/storage/' . $path,
                'is_primary' => true,
                'sort_order' => 1
            ]);
        }

        return response()->json($product->load(['primaryImage', 'components']));
    }

    // DELETE /api/admin/products/{product}
    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully']);
    }
}
