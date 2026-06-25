"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

interface CustomerUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  avatar?: string | null;
}

interface RegisterData {
  username: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: CustomerUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (fields: Partial<CustomerUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("izu_shop_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem("izu_shop_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/customer/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || "Login failed" };

      const customerUser: CustomerUser = {
        id: data.id,
        username: data.username,
        email: data.email || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || "",
        address: data.address || "",
        avatar: data.avatar || null,
      };
      setUser(customerUser);
      try { sessionStorage.setItem("izu_shop_user", JSON.stringify(customerUser)); } catch {}
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, []);

  const register = useCallback(async (regData: RegisterData) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/customer/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || "Registration failed" };
      return await login(regData.username, regData.password);
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    try { sessionStorage.removeItem("izu_shop_user"); } catch {}
  }, []);

  const updateUser = useCallback((fields: Partial<CustomerUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...fields };
      try { sessionStorage.setItem("izu_shop_user", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
