"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Product {
  id: number;
  category: any;
  name: string;
  slug: string;
  image: string | null;
  description: string;
  sell_price: string;
  regular_price: string | null;
  stock: number;
  is_active: boolean;
  is_new_arrivals?: boolean;
  created_at: string;
  badge?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message: string };
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => { success: boolean; message: string };
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "izu_shop_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, loaded]);

  function addToCart(product: Product, quantity = 1) {
    if (product.stock <= 0) return { success: false, message: "Stock Out" };
    const maxAllowed = Math.max(1, Math.floor(product.stock * 0.7));
    const existing = cart.find((item) => item.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    if (currentQty + quantity > maxAllowed) {
      return { success: false, message: `Only ${maxAllowed} items available` };
    }
    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCart((prev) => [...prev, { product, quantity }]);
    }
    return { success: true, message: "Added to cart" };
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true, message: "" };
    }
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return { success: false, message: "Item not found" };
    const maxAllowed = Math.max(1, Math.floor(item.product.stock * 0.7));
    if (quantity > maxAllowed) {
      return { success: false, message: `Only ${maxAllowed} items available` };
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    );
    return { success: true, message: "" };
  }

  function clearCart() {
    setCart([]);
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + parseFloat(item.product.sell_price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal, isCartOpen, openCart, closeCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
