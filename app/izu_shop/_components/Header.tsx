"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "../cart-context";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth-context";

/* ─── Icons ─── */
function CartIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
function SearchIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function MenuIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function UserIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function LogoutIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function CloseIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function ChevronDown({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function GridIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

/* ─── API ─── */
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

interface Product {
  id: number; name: string; slug: string; image: string | null;
  sell_price: string; regular_price: string | null;
}
interface Category { id: number; name: string; slug: string; }

/* ─── Media query hook ─── */
function useMedia(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

/* ─── Header ─── */
export default function Header() {
  const isMobile = useMedia("(max-width: 767px)");
  const { cartCount, openCart } = useCart();
  const router = useRouter();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setMobileSearchOpen(false);
      }
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadCategories = useCallback(async () => {
    if (categories.length > 0) return;
    setCatLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/categories/list/`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : Array.isArray(data?.data) ? data.data : [];
      setCategories(list);
    } catch {}
    setCatLoading(false);
  }, [categories.length]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setShowDropdown(false); return; }
    setSearching(true);
    try {
      const res = await fetch(`${BASE_URL}/api/products/list/?search=${encodeURIComponent(q.trim())}`, { cache: "no-store" });
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setResults(list);
      setShowDropdown(list.length > 0 || q.trim().length > 0);
    } catch {}
    setSearching(false);
  }, []);

  function handleSearchChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 350);
  }

  const handleSidebarOpen = () => {
    setSidebarOpen(true);
    loadCategories();
  };

  const styles = {
    header: {
      background: "#fff",
      borderBottom: "1px solid #f0f0f0",
      padding: "12px 16px",
      position: "sticky" as const,
      top: 0,
      zIndex: 100,
    },
    inner: {
      maxWidth: 1280,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "1fr 2fr 1fr",
      alignItems: "center",
      gap: 16,
    },
    leftSection: {
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    logo: {
      fontSize: 22,
      fontWeight: 900,
      textDecoration: "none",
      color: "#e8320a",
      whiteSpace: "nowrap" as const,
    },
    searchWrap: {
      position: "relative" as const,
      maxWidth: 520,
      margin: "0 auto",
      width: "100%" as const,
    },
    searchBox: {
      display: "flex",
      alignItems: "center",
      background: "#f5f5f5",
      borderRadius: 8,
      padding: "0 12px",
      border: "1px solid #e8e8e8",
    },
    searchInput: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      padding: "10px 8px",
      fontSize: 14,
      color: "#1a1a1a",
      width: "100%" as const,
    },
    dropdown: {
      position: "absolute" as const,
      top: "100%",
      left: 0,
      right: 0,
      background: "#fff",
      border: "1px solid #e8e8e8",
      borderRadius: 8,
      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
      zIndex: 200,
      maxHeight: 360,
      overflow: "auto",
      marginTop: 4,
    },
    navLink: (active?: boolean): React.CSSProperties => ({
      fontSize: 14,
      fontWeight: 600,
      textDecoration: "none",
      color: active ? "#e8320a" : "#555",
    }),
    cartBtn: {
      position: "relative" as const,
      textDecoration: "none",
      color: "#1a1a1a",
    },
    cartBadge: {
      position: "absolute" as const,
      top: -8,
      right: -8,
      background: "#e8320a",
      color: "#fff",
      fontSize: 10,
      fontWeight: 800,
      width: 18,
      height: 18,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    overlay: {
      position: "fixed" as const,
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 199,
    },
    sidebar: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      bottom: 0,
      width: 280,
      background: "#fff",
      zIndex: 200,
      overflowY: "auto" as const,
      boxShadow: "4px 0 20px rgba(0,0,0,0.1)",
      padding: "20px 0",
    },
    sidebarItem: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 20px",
      fontSize: 14,
      fontWeight: 600,
      color: "#1a1a1a",
      textDecoration: "none",
      borderBottom: "1px solid #f5f5f5",
      cursor: "pointer" as const,
    },
    sidebarSubItem: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 20px 10px 48px",
      fontSize: 13,
      fontWeight: 500,
      color: "#555",
      textDecoration: "none",
      borderBottom: "1px solid #f5f5f5",
      cursor: "pointer" as const,
      transition: "background 0.15s",
    } as React.CSSProperties,
  };

  return (
    <>
      <header style={{ ...styles.header, padding: isMobile ? "6px 0" : "12px 16px" }}>
        {isMobile ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", position: "relative", height: 48 }}>
            <button onClick={handleSidebarOpen} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
              <MenuIcon size={22} />
            </button>
            <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
              <a href="/" style={{ ...styles.logo, pointerEvents: "auto", display: "inline-block" }}>
                Izu<span style={{ color: "#1a1a1a" }}>Shop</span>
              </a>
            </div>
            <nav style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#1a1a1a" }}>
                <SearchIcon size={20} />
              </button>
              {!isAuthPage && (
                <button onClick={openCart} style={{ ...styles.cartBtn, background: "none", border: "none", cursor: "pointer" }}>
                  <CartIcon size={22} />
                  {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
                </button>
              )}
            </nav>
          </div>
        ) : (
          <div style={styles.inner}>
            <div style={styles.leftSection}>
              <a href="/" style={styles.logo}>
                Izu<span style={{ color: "#1a1a1a" }}>Shop</span>
              </a>
            </div>

            {/* DESKTOP: search box */}
            <div ref={searchRef} style={styles.searchWrap}>
              <div style={styles.searchBox}>
                <SearchIcon size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => { if (results.length > 0 || query.trim()) setShowDropdown(true); }}
                  style={styles.searchInput}
                />
              </div>
              {showDropdown && (
                <div style={styles.dropdown}>
                  {searching ? (
                    <div style={{ padding: 20, textAlign: "center", color: "#999", fontSize: 13 }}>Searching...</div>
                  ) : results.length > 0 ? (
                    results.map((p) => (
                      <a key={p.id} href={`/product/${p.slug}`}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", textDecoration: "none", borderBottom: "1px solid #f5f5f5" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f9f9f9"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                      >
                        {p.image ? <img src={p.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
                          : <div style={{ width: 40, height: 40, borderRadius: 6, background: "#f0f0f0" }} />}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: "#e8320a", fontWeight: 700 }}>
                            ৳{parseFloat(p.sell_price).toLocaleString("en-BD")}
                          </div>
                        </div>
                      </a>
                    ))
                  ) : query.trim() ? (
                    <div style={{ padding: 20, textAlign: "center", color: "#999", fontSize: 13 }}>No products found</div>
                  ) : null}
                </div>
              )}
            </div>

            <nav style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
              {user ? (
                <a href="/profile" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, textDecoration: "none", color: "#1a1a1a" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e8320a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>
                    {(user.first_name || user.username)[0].toUpperCase()}
                  </div>
                </a>
              ) : (
                <a href="/auth" style={{ display: "flex", alignItems: "center", gap: 6, ...styles.navLink() }}>
                  <UserIcon size={20} />
                </a>
              )}
              {!isAuthPage && (
                <button onClick={openCart} style={{ ...styles.cartBtn, background: "none", border: "none", cursor: "pointer" }}>
                  <CartIcon size={22} />
                  {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
                </button>
              )}
            </nav>
          </div>
        )}

        {/* MOBILE: Expandable search bar */}
        {isMobile && mobileSearchOpen && (
          <div ref={searchRef} style={{
            padding: "8px 16px 12px", borderBottom: "1px solid #f0f0f0",
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              background: "#f5f5f5", borderRadius: 8,
              border: "1px solid #e8e8e8", padding: "0 12px",
            }}>
              <SearchIcon size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => { if (results.length > 0 || query.trim()) setShowDropdown(true); }}
                style={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  padding: "10px 8px", fontSize: 14, color: "#1a1a1a",
                }}
                autoFocus
              />
              <button onClick={() => { setMobileSearchOpen(false); setQuery(""); setResults([]); setShowDropdown(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#999" }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            {showDropdown && (
              <div style={{
                ...styles.dropdown, position: "relative" as const, marginTop: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              }}>
                {searching ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#999", fontSize: 13 }}>Searching...</div>
                ) : results.length > 0 ? (
                  results.map((p) => (
                    <a key={p.id} href={`/product/${p.slug}`}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", textDecoration: "none", borderBottom: "1px solid #f5f5f5" }}
                      onClick={() => { setMobileSearchOpen(false); setShowDropdown(false); }}
                    >
                      {p.image ? <img src={p.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
                        : <div style={{ width: 40, height: 40, borderRadius: 6, background: "#f0f0f0" }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "#e8320a", fontWeight: 700 }}>
                          ৳{parseFloat(p.sell_price).toLocaleString("en-BD")}
                        </div>
                      </div>
                    </a>
                  ))
                ) : query.trim() ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#999", fontSize: 13 }}>No products found</div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </header>

      {/* DESKTOP: Horizontal nav bar below header */}
      {!isMobile && (
        <nav style={{
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
        }}>
          <div style={{
            maxWidth: 1280, margin: "0 auto",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
            padding: "0 16px",
          }}>
            {[
              { href: "/", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10", label: "Home" },
              { href: "/orders", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8", label: "Orders" },
            ].map((item) => (
              <a key={item.label} href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 18px", fontSize: 14, fontWeight: 600,
                  color: "#555", textDecoration: "none", borderRadius: 8,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = "#f5f5f5"; el.style.color = "#e8320a"; }}
                onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = ""; el.style.color = "#555"; }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
                {item.label}
              </a>
            ))}
            <div ref={catRef} style={{ position: "relative" }}>
              <button
                onClick={() => { setCatDropdownOpen(!catDropdownOpen); loadCategories(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 18px", fontSize: 14, fontWeight: 600,
                  color: catDropdownOpen ? "#e8320a" : "#555",
                  background: catDropdownOpen ? "#fef2f0" : "none",
                  border: "none", cursor: "pointer", borderRadius: 8,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!catDropdownOpen) { e.currentTarget.style.background = "#f5f5f5"; e.currentTarget.style.color = "#e8320a"; } }}
                onMouseLeave={(e) => { if (!catDropdownOpen) { e.currentTarget.style.background = ""; e.currentTarget.style.color = "#555"; } }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                Categories
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: catDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              {catDropdownOpen && (
                <div style={{
                  position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                  minWidth: 220, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.12)", zIndex: 200,
                  padding: 8, marginTop: 8,
                }}>
                  <div style={{
                    position: "absolute", top: -6, left: "50%", marginLeft: -6,
                    width: 12, height: 12, background: "#fff",
                    borderLeft: "1px solid #e8e8e8", borderTop: "1px solid #e8e8e8",
                    transform: "rotate(45deg)",
                  }} />
                  <div style={{
                    padding: "10px 14px 8px", fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.5,
                    borderBottom: "1px solid #f0f0f0", marginBottom: 4,
                  }}>
                    All Categories
                  </div>
                  {catLoading ? (
                    <div style={{ padding: "20px 16px", textAlign: "center", fontSize: 13, color: "#999" }}>Loading...</div>
                  ) : categories.length > 0 ? (
                    categories.map((cat, i) => (
                      <a key={cat.id} href={`/category/${cat.slug}`}
                        onClick={() => setCatDropdownOpen(false)}
                        style={{
                          display: "block", padding: "10px 14px", fontSize: 13, fontWeight: 500,
                          color: "#1a1a1a", textDecoration: "none", borderRadius: 8,
                          borderBottom: i < categories.length - 1 ? "1px solid #f8f8f8" : "none",
                          transition: "all 0.12s",
                        }}
                        onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = "#fef2f0"; el.style.color = "#e8320a"; el.style.paddingLeft = "20px"; }}
                        onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = ""; el.style.color = "#1a1a1a"; el.style.paddingLeft = "14px"; }}>
                        {cat.name}
                      </a>
                    ))
                  ) : (
                    <div style={{ padding: "20px 16px", textAlign: "center", fontSize: 13, color: "#999" }}>No categories found.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff", borderTop: "1px solid #f0f0f0",
          display: "flex", alignItems: "center", justifyContent: "space-around",
          padding: "6px 0", zIndex: 150,
          boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
        }}>
          {/* Home */}
          <a href="/"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              fontSize: 10, fontWeight: 600, color: pathname === "/" ? "#e8320a" : "#888",
              textDecoration: "none", padding: "4px 12px", borderRadius: 8, transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" /></svg>
            Home
          </a>
          {/* Menu */}
          <button onClick={handleSidebarOpen}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              fontSize: 10, fontWeight: 600, color: "#888",
              background: "none", border: "none", cursor: "pointer", padding: "4px 12px",
              borderRadius: 8, transition: "background 0.15s", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
            <MenuIcon size={20} />
            Menu
          </button>
          {/* Cart */}
          <button onClick={openCart}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              fontSize: 10, fontWeight: 600, color: "#888",
              background: "none", border: "none", cursor: "pointer", padding: "4px 12px",
              position: "relative", borderRadius: 8, transition: "background 0.15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
            <div style={{ position: "relative" }}>
              <CartIcon size={20} />
              {cartCount > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: -8,
                  background: "#e8320a", color: "#fff", fontSize: 9, fontWeight: 800,
                  width: 16, height: 16, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{cartCount}</span>
              )}
            </div>
            Cart
          </button>
          {/* Orders */}
          <a href="/orders"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              fontSize: 10, fontWeight: 600, color: pathname === "/orders" ? "#e8320a" : "#888",
              textDecoration: "none", padding: "4px 12px", borderRadius: 8, transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" /></svg>
            Orders
          </a>
          {/* Account */}
          {user ? (
            <a href="/profile"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                fontSize: 10, fontWeight: 600, color: pathname === "/profile" ? "#e8320a" : "#888",
                textDecoration: "none", padding: "4px 12px", borderRadius: 8, transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
              <UserIcon size={20} />
              Account
            </a>
          ) : (
            <a href="/auth"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                fontSize: 10, fontWeight: 600, color: pathname === "/auth" ? "#e8320a" : "#888",
                textDecoration: "none", padding: "4px 12px", borderRadius: 8, transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
              <UserIcon size={20} />
              Account
            </a>
          )}
        </nav>
      )}

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>Menu</span>
          <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div style={{ padding: "8px 0" }}>
          {/* ── Shop Section ── */}
          <div style={{ padding: "8px 20px 6px", fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 1 }}>Shop</div>

          <a href="/" style={styles.sidebarItem} onClick={() => setSidebarOpen(false)}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            Homes
          </a>

          {/* Categories: collapsible button */}
          <div>
            <button
              onClick={() => {
                setCategoriesOpen(!categoriesOpen);
                if (!categoriesOpen) loadCategories();
              }}
              style={{ ...styles.sidebarItem, background: "none", border: "none", width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <GridIcon size={18} />
                <span>Categories</span>
              </span>
              <span style={{ transform: categoriesOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "flex" }}>
                <ChevronDown size={16} />
              </span>
            </button>

            {categoriesOpen && (
              <div style={{ background: "#fafafa" }}>
                {catLoading ? (
                  <div style={{ padding: "12px 20px 12px 48px", fontSize: 13, color: "#999" }}>Loading categories...</div>
                ) : categories.length > 0 ? (
                  categories.map((cat) => (
                    <a
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      style={styles.sidebarSubItem}
                      onClick={() => setSidebarOpen(false)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0f0"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                    >
                      {cat.name}
                    </a>
                  ))
                ) : (
                  <div style={{ padding: "12px 20px 12px 48px", fontSize: 13, color: "#999" }}>No categories found.</div>
                )}
              </div>
            )}
          </div>

          {!isAuthPage && (
            <button onClick={() => { openCart(); setSidebarOpen(false); }} style={{ ...styles.sidebarItem, background: "none", border: "none", width: "100%", textAlign: "left" }}>
              <CartIcon size={18} /> Cart
            </button>
          )}

          {/* ── Account Section ── */}
          <div style={{ padding: "12px 20px 6px", fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 1, borderTop: "1px solid #f0f0f0", marginTop: 8 }}>Account</div>

          <a href="/orders" style={styles.sidebarItem} onClick={() => setSidebarOpen(false)}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            Orders
          </a>
          {user ? (
            <>
              <a href="/profile" style={styles.sidebarItem} onClick={() => setSidebarOpen(false)}>
                <UserIcon size={18} /> Profile
              </a>
              <button onClick={() => { logout(); setSidebarOpen(false); router.push("/"); }} style={{ ...styles.sidebarItem, background: "none", border: "none", width: "100%", textAlign: "left" }}>
                <LogoutIcon size={18} /> Logout
              </button>
            </>
          ) : (
            <a href="/auth" style={styles.sidebarItem} onClick={() => setSidebarOpen(false)}>
              <UserIcon size={18} /> Login / Register
            </a>
          )}
        </div>
      </div>
    </>
  );
}
