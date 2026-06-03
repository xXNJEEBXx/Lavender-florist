import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Product } from '../types';

export interface LocalCartItem {
  product: Product;
  quantity: number;
  gift_message?: string;
}

interface CartContextType {
  items: LocalCartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number, giftMessage?: string) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
  getAvailableStock: (product: Product) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'lavender_cart';

function loadCart(): LocalCartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: LocalCartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LocalCartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = (product: Product, quantity = 1, giftMessage?: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, gift_message: giftMessage }];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (productId: number) =>
    items.some((item) => item.product.id === productId);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
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
        item.product.components.forEach(comp => {
          usedComponents[comp.component_id] = (usedComponents[comp.component_id] || 0) + (comp.quantity * item.quantity);
        });
      }
    });

    let minAvailable = Infinity;
    product.components.forEach(comp => {
      const stock = comp.component.stock_quantity;
      const used = usedComponents[comp.component_id] || 0;
      const remainingStock = Math.max(0, stock - used);
      const possibleUnits = Math.floor(remainingStock / comp.quantity);
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
