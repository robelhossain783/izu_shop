"use client";

import { AuthProvider } from "./izu_shop/auth-context";
import { CartProvider } from "./izu_shop/cart-context";
import CartSidebar from "./izu_shop/_components/CartSidebar";

export function ShopProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <CartSidebar />
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
