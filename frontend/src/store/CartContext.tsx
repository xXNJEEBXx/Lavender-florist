import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Product } from '../types';
import { sharedOrderApi } from '../services/api';
import toast from 'react-hot-toast';

export interface LocalCartItem {
  cartItemId: string; // Unique ID for the cart item instance
  product: Product;
  quantity: number;
  options?: Record<string, any>;
  addons?: LocalCartItem[];
}

interface CartContextType {
  items: LocalCartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number, options?: Record<string, any>, addons?: Omit<LocalCartItem, 'cartItemId'>[]) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
  getAvailableStock: (product: Product) => number;
  isSharedSession: boolean;
  sharedToken: string | null;
  exitSharedSession: () => void;
  isLoading: boolean;
  restoreCartItems: (newItems: LocalCartItem[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'lavender_cart';
const SHARED_TOKEN_KEY = 'shared_order_token';

function loadLocalCart(): LocalCartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalCart(items: LocalCartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [sharedToken, setSharedToken] = useState<string | null>(localStorage.getItem(SHARED_TOKEN_KEY));
  const isSharedSession = !!sharedToken;
  const [items, setItems] = useState<LocalCartItem[]>(() => isSharedSession ? [] : loadLocalCart());
  const [isLoading, setIsLoading] = useState(isSharedSession);

  // Save local cart
  useEffect(() => {
    if (!isSharedSession) {
      saveLocalCart(items);
    }
  }, [items, isSharedSession]);

  // Shared session polling
  useEffect(() => {
    if (!isSharedSession || !sharedToken) return;

    let mounted = true;
    const fetchSharedCart = async () => {
      try {
        const res = await sharedOrderApi.getSharedOrder(sharedToken);
        if (mounted) {
          // Transform backend cart items to LocalCartItem format
          const mappedItems: LocalCartItem[] = res.cart.items.map((i: any) => ({
            cartItemId: Date.now().toString() + Math.random().toString(36).substring(7),
            product: {
              ...i.product,
              id: i.product_id, // ensure ID is correct
              price: i.unit_price,
            },
            quantity: i.quantity,
            options: i.options,
            addons: i.addons?.map((a: any) => ({
              product: {
                ...a.product,
                id: a.product_id,
                price: a.unit_price,
              },
              quantity: a.quantity,
              options: a.options
            })) || []
          }));
          
          // Check if items changed to avoid unnecessary rerenders
          setItems(current => {
            const currentStr = JSON.stringify(current.map(c => ({ id: c.product.id, q: c.quantity, a: c.addons?.length })));
            const mappedStr = JSON.stringify(mappedItems.map(m => ({ id: m.product.id, q: m.quantity, a: m.addons?.length })));
            return currentStr === mappedStr ? current : mappedItems;
          });
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // Token expired or order completed
          toast.success('تم إنهاء الجلسة المشتركة بنجاح');
          exitSharedSession();
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    let interval: NodeJS.Timeout;
    if (isSharedSession && sharedToken) {
      // Fetch immediately
      fetchSharedCart(sharedToken);
      // Poll every 10 seconds to avoid blocking PHP built-in server
      interval = setInterval(() => {
        fetchSharedCart(sharedToken);
      }, 10000);
    }

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isSharedSession, sharedToken]);

  // Update backend shared cart
  const syncSharedCart = async (newItems: LocalCartItem[]) => {
    if (!sharedToken) return;
    try {
      const payload = newItems.map(i => ({
        cartItemId: i.cartItemId,
        product_id: i.product.id,
        quantity: i.quantity,
        options: i.options,
        addons: i.addons?.map(a => ({ product_id: a.product.id, quantity: a.quantity, options: a.options })) || []
      }));
      await sharedOrderApi.updateItems(sharedToken, payload);
    } catch (err) {
      console.error('Failed to sync shared cart', err);
      toast.error('حدث خطأ أثناء مزامنة السلة المشتركة');
    }
  };

  const addItem = (product: Product, quantity = 1, options?: Record<string, any>, addons?: Omit<LocalCartItem, 'cartItemId'>[]) => {
    setItems((prev) => {
      // Check if exact same product with exact same options/addons exists (deep comparison is hard, so we just add new item for now, or compare simple options)
      // For simplicity, if it has addons or options, we always add as a new item to avoid merging complex state.
      // If it's a simple product with no addons/options, we can merge quantities.
      
      const hasExtras = (options && Object.keys(options).length > 0) || (addons && addons.length > 0);
      
      let newItems;
      if (!hasExtras) {
        const existing = prev.find((item) => item.product.id === product.id && (!item.addons || item.addons.length === 0) && (!item.options || Object.keys(item.options).length === 0));
        if (existing) {
          newItems = prev.map((item) =>
            item.cartItemId === existing.cartItemId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newItems = [...prev, { cartItemId: Date.now().toString() + Math.random().toString(36).substring(7), product, quantity }];
        }
      } else {
        const fullAddons = addons ? addons.map(a => ({ ...a, cartItemId: Date.now().toString() + Math.random().toString(36).substring(7) })) : [];
        newItems = [...prev, { 
          cartItemId: Date.now().toString() + Math.random().toString(36).substring(7), 
          product, 
          quantity, 
          options, 
          addons: fullAddons 
        }];
      }
      
      if (isSharedSession) syncSharedCart(newItems);
      return newItems;
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.cartItemId !== cartItemId);
      if (isSharedSession) syncSharedCart(newItems);
      return newItems;
    });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) => {
      const newItems = prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      );
      if (isSharedSession) syncSharedCart(newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    if (isSharedSession) syncSharedCart([]);
  };

  const restoreCartItems = (newItems: LocalCartItem[]) => {
    setItems(newItems);
  };

  const exitSharedSession = () => {
    localStorage.removeItem(SHARED_TOKEN_KEY);
    setSharedToken(null);
    setItems(loadLocalCart());
  };

  const isInCart = (productId: number) =>
    items.some((item) => item.product.id === productId);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => {
      const itemBase = item.product.price * item.quantity;
      const addonsTotal = (item.addons || []).reduce((adSum, ad) => adSum + (ad.product.price * ad.quantity), 0);
      return sum + itemBase + addonsTotal;
    },
    0
  );

  const getAvailableStock = (product: Product) => {
    if (!product.components || product.components.length === 0) {
      const inCart = items.find(i => i.product.id === product.id)?.quantity || 0;
      return Math.max(0, (product.calculated_stock || 0) - inCart);
    }

    const usedComponents: Record<number, number> = {};
    items.forEach(item => {
      if (item.product.components) {
        item.product.components.forEach((comp: any) => {
          const compId = comp.id || comp.component_id;
          const qty = comp.pivot ? comp.pivot.quantity : (comp.quantity || 1);
          usedComponents[compId] = (usedComponents[compId] || 0) + (qty * item.quantity);
        });
      }
    });

    let minAvailable = Infinity;
    product.components.forEach((comp: any) => {
      const compId = comp.id || comp.component_id;
      const stock = comp.pivot ? comp.stock_quantity : (comp.component?.stock_quantity ?? comp.stock_quantity ?? 0);
      const qty = comp.pivot ? comp.pivot.quantity : (comp.quantity || 1);
      
      const used = usedComponents[compId] || 0;
      const remainingStock = Math.max(0, stock - used);
      const possibleUnits = qty > 0 ? Math.floor(remainingStock / qty) : Infinity;
      
      if (possibleUnits < minAvailable) {
        minAvailable = possibleUnits;
      }
    });

    return minAvailable === Infinity ? 0 : minAvailable;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
        getAvailableStock,
        isSharedSession,
        sharedToken,
        exitSharedSession,
        isLoading,
        restoreCartItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
