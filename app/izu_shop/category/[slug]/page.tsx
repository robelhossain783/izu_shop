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

  const displayedProducts = showAll ? products : products.slice(0, visibleCount);
  const hasMore = !showAll && visibleCount < products.length;

  function handleAddToCart(product: Product) {
    addToCart(product, 1);
    openCart();
  }

  return (
    <>
      <Header />
      <div className="offer-page" style={{ paddingTop: 32 }} id="izu-grid">
        <div className="offer-section-header">
          <h2 className="offer-section-title">{categoryTitle || "Category"}</h2>
          <p className="offer-section-desc">Browse products under {categoryTitle || "this category"}</p>
        </div>

        {loading ? (
          <div className="offer-empty">
            <div className="offer-empty-icon">⏳</div>
            <h3 className="offer-empty-title">Loading Products...</h3>
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
                  <a key={product.id} href={`/izu_shop/product/${product.slug}`} className="offer-card" style={{ textDecoration: "none" }}>
                    {discount > 0 && <div className="offer-card-badge">-{discount}%</div>}
                    <div className="offer-card-img" style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)` }}>
                      {product.image ? (
                        <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                      ) : (
                        <span className="offer-card-img-emoji">{emoji}</span>
                      )}
                      {!product.image && categoryName && <span className="offer-card-img-label">{categoryName}</span>}
                    </div>
                    <div className="offer-card-body">
                      <h3 className="offer-card-name">{product.name}</h3>
                      <div className="offer-card-prices">
                        {originalPrice > 0 && <span className="offer-card-original">{formatPrice(originalPrice)}</span>}
                        <span className="offer-card-discounted">{formatPrice(sellPrice)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="offer-card-save">
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>
                          Save {formatPrice(originalPrice - sellPrice)}
                        </div>
                      )}
                      <div className="offer-card-actions">
                        <button type="button" className="offer-card-btn" style={{ width: "100%" }}
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
            <div className="offer-empty-icon">🛍️</div>
            <h3 className="offer-empty-title">No Products Found</h3>
            <p className="offer-empty-desc">We currently don&apos;t have any items under <strong>{categoryTitle}</strong>.</p>
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
