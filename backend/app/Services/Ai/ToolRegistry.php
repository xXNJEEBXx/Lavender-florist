<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;

class ToolRegistry
{
    /**
     * Get the JSON Schema for all available tools.
     */
    public function getToolsSchema(): array
    {
        return [
            // ================== Products & Inventory ==================
            [
                'name' => 'get_all_products',
                'description' => 'Retrieves a list of all products in the store.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => new \stdClass(),
                ]
            ],
            [
                'name' => 'get_all_components',
                'description' => 'Retrieves a list of all raw components and inventory items.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => new \stdClass(),
                ]
            ],
            [
                'name' => 'check_low_stock',
                'description' => 'Checks for products or components that have low stock.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'threshold' => ['type' => 'integer', 'description' => 'Stock quantity threshold to check against (e.g., 5).']
                    ],
                ]
            ],
            [
                'name' => 'display_product_info',
                'description' => 'Retrieves product information to display in a rich UI card in chat.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'product_id' => ['type' => 'integer', 'description' => 'ID of the product.']
                    ],
                    'required' => ['product_id']
                ]
            ],
            [
                'name' => 'search_product_by_name',
                'description' => 'Searches for a product by name and returns basic info.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'query' => ['type' => 'string', 'description' => 'Search term.']
                    ],
                    'required' => ['query']
                ]
            ],
            [
                'name' => 'add_product',
                'description' => 'Adds a new product to the store catalog. You MUST include raw components (like flowers, vase, wrapping) so the stock can be tracked.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'name' => ['type' => 'string', 'description' => 'Name of the product in Arabic'],
                        'name_en' => ['type' => 'string', 'description' => 'Name of the product in English (optional)'],
                        'price' => ['type' => 'number', 'description' => 'Price of the product'],
                        'category' => ['type' => 'string', 'enum' => ['bouquets', 'boxes', 'vases', 'baskets', 'leis', 'bridal', 'gifts', 'fresh-flowers', 'add_ons', 'cards'], 'description' => 'Category of the product'],
                        'occasions' => [
                            'type' => 'array',
                            'items' => ['type' => 'string', 'enum' => ['congratulations', 'love', 'get-well', 'birthday', 'new-baby', 'sympathy', 'wedding', 'graduation', 'ramadan', 'national-day', 'teachers-day', 'mothers-day', 'womens-day', 'fathers-day']],
                            'description' => 'List of occasions suitable for this product (optional)'
                        ],
                        'description' => ['type' => 'string', 'description' => 'Description of the product (optional)'],
                        'image_url' => ['type' => 'string', 'description' => 'URL of the product image if the user uploaded or provided one (optional)'],
                        'components' => [
                            'type' => 'array',
                            'description' => 'List of raw components required to make this product.',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'name' => ['type' => 'string', 'description' => 'Name of the component (e.g., ورد جوري أحمر, تغليف فاخر)'],
                                    'category' => ['type' => 'string', 'enum' => ['flower', 'greens', 'container', 'wrapping', 'accessory', 'food', 'filler', 'dried'], 'description' => 'Category of the component'],
                                    'quantity' => ['type' => 'integer', 'description' => 'Quantity needed for one product'],
                                    'cost_per_unit' => ['type' => 'number', 'description' => 'Estimated cost per unit (optional, default 0)']
                                ],
                                'required' => ['name', 'category', 'quantity']
                            ]
                        ]
                    ],
                    'required' => ['name', 'price', 'category', 'components']
                ]
            ],
            [
                'name' => 'add_component',
                'description' => 'Adds a new component (raw material like flowers, vases, ribbons) to the inventory.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'name' => ['type' => 'string', 'description' => 'Name of the component in Arabic'],
                        'category' => ['type' => 'string', 'enum' => ['flower', 'greens', 'container', 'wrapping', 'accessory', 'food', 'filler', 'dried'], 'description' => 'Category of the component'],
                        'stock_quantity' => ['type' => 'integer', 'description' => 'Initial stock quantity'],
                        'cost_per_unit' => ['type' => 'number', 'description' => 'Cost per unit (optional)'],
                        'unit' => ['type' => 'string', 'description' => 'Unit of measurement (e.g. piece, stem, meter) (optional)'],
                    ],
                    'required' => ['name', 'category', 'stock_quantity']
                ]
            ],
            [
                'name' => 'update_product_price',
                'description' => 'Updates the price of an existing product.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'product_id' => ['type' => 'integer', 'description' => 'ID of the product'],
                        'new_price' => ['type' => 'number', 'description' => 'The new price to set']
                    ],
                    'required' => ['product_id', 'new_price']
                ]
            ],
            [
                'name' => 'toggle_product_status',
                'description' => 'Activates or deactivates a product (show/hide in store).',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'product_id' => ['type' => 'integer', 'description' => 'ID of the product'],
                        'is_active' => ['type' => 'boolean', 'description' => 'true to activate, false to deactivate']
                    ],
                    'required' => ['product_id', 'is_active']
                ]
            ],
            [
                'name' => 'update_component_stock',
                'description' => 'Updates the stock quantity of a raw component.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'component_id' => ['type' => 'integer', 'description' => 'ID of the component'],
                        'quantity_to_add' => ['type' => 'integer', 'description' => 'Quantity to add (use negative numbers to subtract)']
                    ],
                    'required' => ['component_id', 'quantity_to_add']
                ]
            ],

            // ================== Store & Settings ==================
            [
                'name' => 'get_store_settings',
                'description' => 'Gets the current store configuration, such as delivery discount policies and working hours.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => new \stdClass(),
                ]
            ],

            // ================== Orders & Sales ==================
            [
                'name' => 'get_todays_orders_summary',
                'description' => 'Gets a summary of today\'s orders and revenue.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => new \stdClass(),
                ]
            ],
            [
                'name' => 'get_active_orders',
                'description' => 'Gets a list of all active orders (preparing, ready, delivering).',
                'parameters' => [
                    'type' => 'object',
                    'properties' => new \stdClass(),
                ]
            ],
            [
                'name' => 'get_order_details',
                'description' => 'Gets detailed information about a specific order by its order number or ID.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'order_identifier' => ['type' => 'string', 'description' => 'Order ID or Order Number (e.g. ORD-12345)']
                    ],
                    'required' => ['order_identifier']
                ]
            ],
            [
                'name' => 'update_order_status',
                'description' => 'Changes the status of an order.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'order_id' => ['type' => 'integer', 'description' => 'ID of the order'],
                        'new_status' => ['type' => 'string', 'description' => 'New status: pending, confirmed, preparing, ready, delivering, delivered, cancelled']
                    ],
                    'required' => ['order_id', 'new_status']
                ]
            ],

            // ================== Drivers ==================
            [
                'name' => 'get_available_drivers',
                'description' => 'Gets a list of drivers and their current status.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => new \stdClass(),
                ]
            ],
            [
                'name' => 'assign_order_to_driver',
                'description' => 'Assigns an order to a specific driver for delivery.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'order_id' => ['type' => 'integer', 'description' => 'ID of the order'],
                        'driver_id' => ['type' => 'integer', 'description' => 'ID of the driver']
                    ],
                    'required' => ['order_id', 'driver_id']
                ]
            ],

            // ================== Customers ==================
            [
                'name' => 'search_customers',
                'description' => 'Searches for customers by name or phone number.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'query' => ['type' => 'string', 'description' => 'Name or phone number to search for']
                    ],
                    'required' => ['query']
                ]
            ],
            [
                'name' => 'get_customer_history',
                'description' => 'Gets the purchase history and details of a specific customer.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'customer_id' => ['type' => 'integer', 'description' => 'ID of the customer']
                    ],
                    'required' => ['customer_id']
                ]
            ]
        ];
    }

    /**
     * Execute a specific tool.
     */
    public function executeTool(string $name, array $arguments)
    {
        Log::info("AI Tool Execution Request: {$name}", $arguments);

        switch ($name) {
            case 'get_all_products': return $this->executeGetAllProducts($arguments);
            case 'get_all_components': return $this->executeGetAllComponents($arguments);
            case 'check_low_stock': return $this->executeCheckLowStock($arguments);
            case 'display_product_info': return $this->executeDisplayProductInfo($arguments);
            case 'search_product_by_name': return $this->executeSearchProductByName($arguments);
            case 'add_product': return $this->executeAddProduct($arguments);
            case 'add_component': return $this->executeAddComponent($arguments);
            case 'update_product_price': return $this->executeUpdateProductPrice($arguments);
            case 'toggle_product_status': return $this->executeToggleProductStatus($arguments);
            case 'update_component_stock': return $this->executeUpdateComponentStock($arguments);
            
            case 'get_store_settings': return $this->executeGetStoreSettings($arguments);
            
            case 'get_todays_orders_summary': return $this->executeGetTodaysOrdersSummary($arguments);
            case 'get_active_orders': return $this->executeGetActiveOrders($arguments);
            case 'get_order_details': return $this->executeGetOrderDetails($arguments);
            case 'update_order_status': return $this->executeUpdateOrderStatus($arguments);
            
            case 'get_available_drivers': return $this->executeGetAvailableDrivers($arguments);
            case 'assign_order_to_driver': return $this->executeAssignOrderToDriver($arguments);
            
            case 'search_customers': return $this->executeSearchCustomers($arguments);
            case 'get_customer_history': return $this->executeGetCustomerHistory($arguments);
            
            default:
                throw new \Exception("Tool {$name} not found.");
        }
    }

    // ==========================================
    // PRODUCTS & COMPONENTS
    // ==========================================

    protected function executeGetAllProducts(array $args)
    {
        $products = \App\Models\Product::orderBy('name')->get(['id', 'name', 'price', 'category', 'is_active']);
        return ['status' => 'success', 'count' => $products->count(), 'products' => $products];
    }

    protected function executeGetAllComponents(array $args)
    {
        $components = \App\Models\Component::orderBy('name')->get(['id', 'name', 'category', 'stock_quantity', 'cost_per_unit']);
        return ['status' => 'success', 'count' => $components->count(), 'components' => $components];
    }

    protected function executeCheckLowStock(array $args)
    {
        $threshold = $args['threshold'] ?? 5;
        $lowComponents = \App\Models\Component::where('stock_quantity', '<=', $threshold)->get(['id', 'name', 'stock_quantity', 'min_stock_alert']);

        return [
            'status' => 'success',
            'message' => "Found " . $lowComponents->count() . " components with low stock.",
            'components' => $lowComponents
        ];
    }

    protected function executeDisplayProductInfo(array $args)
    {
        $product = \App\Models\Product::with('images')->find($args['product_id']);
        if (!$product) return ['status' => 'error', 'message' => 'Product not found.'];

        return [
            'status' => 'success',
            'type' => 'ui_card',
            'card_type' => 'product',
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'is_active' => $product->is_active,
                'image_url' => $product->images->first() ? asset($product->images->first()->image_url) : null,
                'category_name' => $product->category ?? 'Uncategorized'
            ]
        ];
    }

    protected function executeSearchProductByName(array $args)
    {
        $products = \App\Models\Product::where('name', 'like', "%{$args['query']}%")
            ->take(5)
            ->get(['id', 'name', 'price']);
        return ['status' => 'success', 'results' => $products];
    }

    protected function executeAddProduct(array $args)
    {
        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $product = \App\Models\Product::create([
                'name' => $args['name'],
                'name_en' => $args['name_en'] ?? null,
                'price' => $args['price'],
                'category' => $args['category'],
                'occasions' => $args['occasions'] ?? null,
                'description' => $args['description'] ?? null,
                'is_active' => true,
            ]);

            if (!empty($args['image_url'])) {
                \App\Models\ProductImage::create([
                    'product_id' => $product->id,
                    'image_url' => $args['image_url'],
                    'is_primary' => true,
                    'sort_order' => 1
                ]);
            }

            $attachedComponents = [];
            if (!empty($args['components']) && is_array($args['components'])) {
                foreach ($args['components'] as $compData) {
                    // Try to find an existing component with the same name
                    $component = \App\Models\Component::firstOrCreate(
                        ['name' => $compData['name']],
                        [
                            'category' => $compData['category'] ?? 'flower',
                            'stock_quantity' => 100, // Default initial stock for AI created components
                            'cost_per_unit' => $compData['cost_per_unit'] ?? 0,
                            'unit' => 'piece',
                            'is_active' => true
                        ]
                    );

                    $product->components()->attach($component->id, ['quantity' => $compData['quantity']]);
                    $attachedComponents[] = $component->name;
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            return [
                'status' => 'success',
                'type' => 'ui_card',
                'card_type' => 'product',
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'stock' => tap($product, function($p) { $p->load('components'); })->calculated_stock ?? 0,
                    'image_url' => !empty($args['image_url']) ? asset($args['image_url']) : null,
                ],
                'system_alert_message' => 'تم إنشاء منتج جديد: ' . $product->name . ' بنجاح.',
                'message' => 'Product created successfully with components: ' . implode(', ', $attachedComponents),
            ];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return ['status' => 'error', 'message' => 'Failed to add product: ' . $e->getMessage()];
        }
    }

    protected function executeAddComponent(array $args)
    {
        try {
            $component = \App\Models\Component::create([
                'name' => $args['name'],
                'category' => $args['category'],
                'stock_quantity' => $args['stock_quantity'] ?? 0,
                'cost_per_unit' => $args['cost_per_unit'] ?? 0,
                'unit' => $args['unit'] ?? 'piece',
                'is_active' => true,
            ]);
            return [
                'status' => 'success',
                'type' => 'ui_card',
                'card_type' => 'component',
                'component' => [
                    'id' => $component->id,
                    'name' => $component->name,
                    'category' => $component->category,
                    'stock_quantity' => $component->stock_quantity,
                ],
                'system_alert_message' => 'تم إنشاء مكون جديد: ' . $component->name . ' بنجاح.',
                'message' => 'Component created successfully'
            ];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => 'Failed to add component: ' . $e->getMessage()];
        }
    }

    protected function executeUpdateProductPrice(array $args)
    {
        $product = \App\Models\Product::find($args['product_id']);
        if (!$product) return ['status' => 'error', 'message' => 'Product not found.'];
        
        $oldPrice = $product->price;
        $product->update(['price' => $args['new_price']]);
        return ['status' => 'success', 'message' => "Product price updated from {$oldPrice} to {$args['new_price']}"];
    }

    protected function executeToggleProductStatus(array $args)
    {
        $product = \App\Models\Product::find($args['product_id']);
        if (!$product) return ['status' => 'error', 'message' => 'Product not found.'];
        
        $product->update(['is_active' => $args['is_active']]);
        return ['status' => 'success', 'message' => "Product status changed to " . ($args['is_active'] ? 'Active' : 'Inactive')];
    }

    protected function executeUpdateComponentStock(array $args)
    {
        $component = \App\Models\Component::find($args['component_id']);
        if (!$component) return ['status' => 'error', 'message' => 'Component not found.'];
        
        $oldStock = $component->stock_quantity;
        $component->increment('stock_quantity', $args['quantity_to_add']);
        
        return ['status' => 'success', 'message' => "Component stock updated from {$oldStock} to {$component->stock_quantity}"];
    }

    // ==========================================
    // STORE SETTINGS
    // ==========================================

    protected function executeGetStoreSettings(array $args)
    {
        $settings = \App\Models\StoreSetting::all()->pluck('value', 'key')->toArray();
        return ['status' => 'success', 'settings' => $settings];
    }

    // ==========================================
    // ORDERS
    // ==========================================

    protected function executeGetTodaysOrdersSummary(array $args)
    {
        $today = now()->startOfDay();
        $ordersCount = \App\Models\Order::where('created_at', '>=', $today)->count();
        $revenue = \App\Models\Order::where('created_at', '>=', $today)
            ->whereIn('status', ['confirmed', 'preparing', 'ready', 'delivering', 'delivered'])
            ->sum('total');
        return ['status' => 'success', 'orders_count' => $ordersCount, 'total_revenue' => $revenue];
    }

    protected function executeGetActiveOrders(array $args)
    {
        $orders = \App\Models\Order::whereIn('status', ['preparing', 'ready', 'delivering'])
            ->with(['driver:id,name', 'customer:id,name,phone'])
            ->get(['id', 'order_number', 'status', 'total', 'customer_id', 'driver_id', 'created_at']);
            
        return ['status' => 'success', 'count' => $orders->count(), 'orders' => $orders];
    }

    protected function executeGetOrderDetails(array $args)
    {
        $orderIdentifier = $args['order_identifier'];
        $order = \App\Models\Order::with(['items.product', 'customer', 'driver', 'address'])
            ->where('id', $orderIdentifier)
            ->orWhere('order_number', $orderIdentifier)
            ->first();
            
        if (!$order) return ['status' => 'error', 'message' => 'Order not found.'];
        return ['status' => 'success', 'order' => $order];
    }

    protected function executeUpdateOrderStatus(array $args)
    {
        $order = \App\Models\Order::find($args['order_id']);
        if (!$order) return ['status' => 'error', 'message' => 'Order not found.'];
        
        $validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];
        if (!in_array($args['new_status'], $validStatuses)) {
            return ['status' => 'error', 'message' => 'Invalid status provided.'];
        }
        
        $oldStatus = $order->status;
        $order->update(['status' => $args['new_status']]);
        return ['status' => 'success', 'message' => "Order {$order->order_number} status updated from {$oldStatus} to {$args['new_status']}"];
    }

    // ==========================================
    // DRIVERS
    // ==========================================

    protected function executeGetAvailableDrivers(array $args)
    {
        $drivers = \App\Models\Driver::get(['id', 'name', 'phone', 'is_active']);
        return ['status' => 'success', 'drivers' => $drivers];
    }

    protected function executeAssignOrderToDriver(array $args)
    {
        $order = \App\Models\Order::find($args['order_id']);
        $driver = \App\Models\Driver::find($args['driver_id']);
        
        if (!$order) return ['status' => 'error', 'message' => 'Order not found.'];
        if (!$driver) return ['status' => 'error', 'message' => 'Driver not found.'];
        
        $order->update([
            'driver_id' => $driver->id,
            'status' => 'delivering' // Auto update status to delivering
        ]);
        
        return ['status' => 'success', 'message' => "Order {$order->order_number} assigned to driver {$driver->name}."];
    }

    // ==========================================
    // CUSTOMERS
    // ==========================================

    protected function executeSearchCustomers(array $args)
    {
        $customers = \App\Models\User::customers()
            ->where(function($q) use ($args) {
                $q->where('name', 'like', "%{$args['query']}%")
                  ->orWhere('phone', 'like', "%{$args['query']}%");
            })
            ->take(5)
            ->get(['id', 'name', 'phone', 'email', 'is_active']);
            
        return ['status' => 'success', 'results' => $customers];
    }

    protected function executeGetCustomerHistory(array $args)
    {
        $customer = \App\Models\User::customers()->with(['orders' => function($q) {
            $q->latest()->take(5);
        }])->find($args['customer_id']);
        
        if (!$customer) return ['status' => 'error', 'message' => 'Customer not found.'];
        
        $totalSpent = $customer->orders()->whereIn('status', ['confirmed', 'preparing', 'ready', 'delivering', 'delivered'])->sum('total');
        $ordersCount = $customer->orders()->count();
        
        return [
            'status' => 'success', 
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'total_orders' => $ordersCount,
                'total_spent' => $totalSpent,
                'recent_orders' => $customer->orders
            ]
        ];
    }
}
