// ===== User & Auth =====
export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'customer' | 'admin';
  avatar_url: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: number;
  user_id: number;
  label: string;
  city: string;
  district: string;
  street: string;
  building_number: string;
  floor: string | null;
  apartment: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  google_maps_link?: string | null;
  door_image_path?: string | null;
}

// ===== Products =====
export interface Component {
  id: number;
  name: string;
  type: 'flower' | 'green' | 'accessory' | 'wrapping' | 'container';
  unit: string;
  cost_per_unit: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductComponent {
  id: number;
  component_id: number;
  component: Component;
  quantity: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  cost: number | null;
  category: 'bouquets' | 'boxes' | 'vases' | 'baskets' | 'leis' | 'bridal' | 'gifts' | 'fresh-flowers' | 'add_ons' | 'cards';
  occasions: ('graduation' | 'wedding' | 'love' | 'new-baby' | 'eid' | 'general' | 'all')[] | null;
  sku: string;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  allows_gift_message: boolean;
  estimated_prep_time: number;
  images: ProductImage[];
  components: ProductComponent[];
  primary_image_url: string | null;
  is_in_stock: boolean;
  discount_percentage: number | null;
  created_at: string;
  updated_at: string;
}

// ===== Cart =====
export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  gift_message: string | null;
  unit_price: number;
  total_price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  coupon: Coupon | null;
}

// ===== Orders =====
export interface OrderItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  gift_message: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  owner_name: string | null;
  owner_phone: string | null;
  user_id: number;
  user: User;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'cod' | 'card' | 'bank_transfer';
  payment_justification: string | null;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  delivery_address: Address | null;
  delivery_type: 'delivery' | 'pickup';
  delivery_date: string | null;
  delivery_time_slot: string | null;
  scheduled_at: string | null;
  notes: string | null;
  coupon_id: number | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// ===== Coupons =====
export interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

// ===== Notifications =====
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// ===== Gift Message =====
export interface GiftMessage {
  sender_name: string;
  recipient_name: string;
  message: string;
}

// ===== Activity Log =====
export interface ActivityLog {
  id: number;
  user_id: number | null;
  user: User | null;
  action: string;
  description: string;
  model_type: string | null;
  model_id: number | null;
  properties: Record<string, unknown>;
  created_at: string;
}

// ===== Store Settings =====
export interface WorkingHours {
  day: string;
  open: string;
  close: string;
  is_closed: boolean;
}

export interface StoreSettings {
  store_name: string;
  store_name_ar: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  email: string;
  address: string;
  city: string;
  delivery_fee: number;
  free_delivery_threshold: number;
  min_order_amount: number;
  working_hours: WorkingHours[];
  is_store_open: boolean;
}

// ===== API Response =====
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// ===== Dashboard Stats =====
export interface DashboardStats {
  today_sales: number;
  today_orders: number;
  monthly_revenue: number;
  total_customers: number;
  pending_orders: number;
  low_stock_items: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}
