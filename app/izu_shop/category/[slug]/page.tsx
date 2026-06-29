"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCart } from "../../cart-context";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import "../../izu_shop.css";

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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

function formatPrice(price: number) {
  return `৳${price.toLocaleString("en-BD")}`;
}

function calcDiscount(regular: number, sell: number) {
  if (!regular || regular <= 0) return 0;
  return Math.round(((regular - sell) / regular) * 100);
}

const COLORS = ["#4f46e5", "#0891b2", "#7c3aed", "#059669", "#d97706", "#1e293b", "#dc2626", "#2563eb"];
const EMOJIS = ["🎧", "⌚", "🔊", "🔋", "👛", "🕶️", "🏃", "🔌"];

function CartIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function CategoryContent() {
  const { addToCart, openCart } = useCart();
  const params = useParams();
  const slug = params.slug as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setVisibleCount(20);
      setShowAll(false);

      try {
        // Resolve category name and fetch products
        let foundName = "";
        const catRes = await fetch(`${BASE_URL}/api/categories/list/`);
        if (catRes.ok) {
          const cats = await catRes.json();
          const found = cats.find((cat: any) =>
            cat.slug?.toLowerCase() === slug.toLowerCase() ||
            cat.name?.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase()
          );
          if (found) foundName = found.name;
        }
        setCategoryTitle(foundName || slug.charAt(0).toUpperCase() + slug.slice(1));

        // Fetch all products and filter by category
        const allProducts: Product[] = await (await fetch(`${BASE_URL}/api/products/list/`)).json();
        const filtered = allProducts.filter((product) => {
          if (!product.category) return false;
          const prodSlug = typeof product.category === "object"
            ? (product.category as { slug?: string }).slug?.toLowerCase()
            : "";
          const prodName = typeof product.category === "object"
            ? (product.category as { name?: string }).name?.toLowerCase().replace(/\s+/g, "-")
            : "";
          return prodSlug === slug.toLowerCase() || prodName === slug.toLowerCase();
        });
        setProducts(filtered);
      } catch (error) {
        console.error("Failed to load category products:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === "price-low") return parseFloat(a.sell_price) - parseFloat(b.sell_price);
    if (sortBy === "price-high") return parseFloat(b.sell_price) - parseFloat(a.sell_price);
    return 0;
  });

  const displayedProducts = (showAll ? sortedProducts : sortedProducts.slice(0, visibleCount));
  const hasMore = !showAll && visibleCount < products.length;

  function handleAddToCart(product: Product) {
    addToCart(product, 1);
    openCart();
  }

  return (
    <>
      <Header />
      <div className="offer-page" style={{ paddingTop: 32 }} id="izu-grid">
        <nav className="izu-pd-breadcrumb" style={{ marginBottom: 16 }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", color: "inherit", textDecoration: "none" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" /></svg>
          </a>
          <span className="izu-pd-breadcrumb-sep">/</span>
          <span className="izu-pd-breadcrumb-current">{categoryTitle || "Category"}</span>
        </nav>

        <div className="all-products-header" style={{ marginBottom: 24 }}>
          <h2 className="all-products-title">{categoryTitle || "Category"}</h2>
          {!loading && products.length > 0 && (
            <div className="all-products-sort">
              <label style={{ fontSize: 13, color: "#888", fontWeight: 600, whiteSpace: "nowrap" }}>Sort by:</label>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setVisibleCount(20); setShowAll(false); }}
                style={{
                  padding: "8px 14px", border: "1px solid #e8e8e8", borderRadius: 8,
                  fontSize: 13, fontWeight: 500, color: "#1a1a1a", background: "#fff",
                  cursor: "pointer", fontFamily: "inherit", outline: "none",
                }}>
                <option value="default">Default</option>
                <option value="price-low">Low to High</option>
                <option value="price-high">High to Low</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="offer-empty">
            <div className="offer-spinner" />
            <h3 className="offer-empty-title" style={{ marginTop: 20 }}>Loading Products</h3>
            <p className="offer-empty-desc">Please wait while we fetch products for you.</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="offer-grid">
              {displayedProducts.map((product, index) => {
                const originalPrice = parseFloat(product.regular_price || "0");
                const sellPrice = parseFloat(product.sell_price || "0");
                const discount = calcDiscount(originalPrice, sellPrice);
                const color = COLORS[index % COLORS.length];
                const emoji = EMOJIS[index % EMOJIS.length];
                const categoryName =
                  typeof product.category === "object" && product.category
                    ? (product.category as { name?: string }).name || ""
                    : "";

                return (
                  <a key={product.id} href={`/product/${product.slug}`} className="offer-card" style={{ textDecoration: "none" }}>
                    {discount > 0 && <div className="offer-card-badge">-{discount}%</div>}
                    <div className="offer-card-img" style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)` }}>
                      {product.image ? (
                        <img src={product.image} alt={product.name} style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain", display: "block", transition: "transform 0.3s" }} />
                      ) : (
                        <>
                          <span className="offer-card-img-emoji">{emoji}</span>
                          {categoryName && <span className="offer-card-img-label">{categoryName}</span>}
                        </>
                      )}
                    </div>
                    <div className="offer-card-body">
                      <h3 className="offer-card-name">{product.name}</h3>
                      <div className="offer-card-prices">
                        {originalPrice > 0 && <span className="offer-card-original">{formatPrice(originalPrice)}</span>}
                        <span className="offer-card-discounted">{formatPrice(sellPrice)}</span>
                      </div>
                      <div className="offer-card-actions">
                        <button type="button" className="offer-card-btn"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}>
                          <CartIcon size={14} /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
            {!showAll && products.length > 20 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 32 }}>
                {hasMore && (
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 20)}
                    style={{
                      background: "none", border: "2px solid #e8320a", color: "#e8320a",
                      padding: "10px 36px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                      cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#e8320a"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#e8320a"; }}
                  >
                    See More
                  </button>
                )}
                <button
                  onClick={() => setShowAll(true)}
                  style={{
                    background: "#e8320a", border: "2px solid #e8320a", color: "#fff",
                    padding: "10px 36px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#cc2908"; e.currentTarget.style.borderColor = "#cc2908"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#e8320a"; e.currentTarget.style.borderColor = "#e8320a"; }}
                >
                  View All
                </button>
              </div>
            )}
            {showAll && products.length > 20 && (
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <button
                  onClick={() => { setShowAll(false); setVisibleCount(20); }}
                  style={{
                    background: "none", border: "2px solid #e8320a", color: "#e8320a",
                    padding: "10px 36px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#e8320a"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#e8320a"; }}
                >
                  Show Less
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="offer-empty">
            <div className="offer-empty-icon">
              <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
                <rect x="8" y="20" width="64" height="48" rx="6" stroke="#d4d4d4" strokeWidth="2.5" fill="#f9f9f9"/>
                <path d="M28 32h24M28 40h24M28 48h16" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round"/>
                <path d="M40 8l8 12H32l8-12z" fill="#f0f0f0" stroke="#d4d4d4" strokeWidth="2" strokeLinejoin="round"/>
                <circle cx="56" cy="56" r="14" fill="#fef2f0" stroke="#e8320a" strokeWidth="2"/>
                <path d="M52 56h8M56 52v8" stroke="#e8320a" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="offer-empty-title">No products found</h3>
            <p className="offer-empty-desc">We couldn&apos;t find anything under <strong>{categoryTitle}</strong>. Try browsing other categories.</p>
            <a href="/" className="offer-empty-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10"/></svg>
              Browse Home
            </a>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default function CategoryPage() {
  return <CategoryContent />;
}
