"use client";

import { useEffect, useState } from "react";
import { useCart } from "./cart-context";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import "./izu_shop.css";

/* ─── Product Type ─── */
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

/* ─── Icons ─── */
function ZapIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function PercentIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}
function ClockIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function TruckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function ShieldIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function CartIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
/* ─── API ─── */
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

async function fetchProducts(): Promise<Product[]> {
  try {
    return await (await fetch(`${BASE_URL}/api/products/list/`)).json();
  } catch (error) {
    console.log("API ERROR:", error);
    return [];
  }
}

/* ─── Helpers ─── */
function formatPrice(price: number) {
  return `৳${price.toLocaleString("en-BD")}`;
}

function calcDiscount(regular: number, sell: number) {
  if (!regular || regular <= 0) return 0;
  return Math.round(((regular - sell) / regular) * 100);
}

const COLORS = ["#4f46e5", "#0891b2", "#7c3aed", "#059669", "#d97706", "#1e293b", "#dc2626", "#2563eb"];
const EMOJIS = ["🎧", "⌚", "🔊", "🔋", "👛", "🕶️", "🏃", "🔌"];

const benefits = [
  { icon: <TruckIcon size={22} />, label: "Free Shipping", desc: "On orders over ৳999" },
  { icon: <ShieldIcon size={22} />, label: "100% Authentic", desc: "Genuine products guaranteed" },
  { icon: <ClockIcon size={22} />, label: "Limited Time", desc: "Offers end soon" },
  { icon: <PercentIcon size={22} />, label: "Best Prices", desc: "Price match promise" },
];

const PAGE_SIZE = 20;

/* ─── Main Content ─── */
function ShopContent() {
  const { addToCart, openCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const displayedProducts = showAll ? products : products.slice(0, visibleCount);
  const hasMore = !showAll && visibleCount < products.length;

  function handleAddToCart(product: Product) {
    addToCart(product, 1);
    openCart();
  }

  return (
    <>
      <Header />

      <section className="offer-hero">
        <div className="offer-hero-bg-pattern" />
        <div className="offer-hero-content">
          <span className="offer-hero-badge">Izu Shop Exclusive</span>
          <h1 className="offer-hero-title">Premium Picks Just For You</h1>
          <p className="offer-hero-subtitle">
            Discover handpicked products at unbeatable prices. Quality you can trust, savings you will love.
          </p>
          <div className="offer-hero-actions">
            <a href="#izu-grid" className="offer-hero-btn-primary">
              <ZapIcon size={16} />
              Shop Now
            </a>
            <a href="#benefits" className="offer-hero-btn-outline">
              Learn More
            </a>
          </div>
        </div>
        <div className="offer-hero-stats">
          <div className="offer-hero-stat">
            <span className="offer-hero-stat-value">{products.length > 0 ? `${products.length}+` : "..."}</span>
            <span className="offer-hero-stat-label">Products</span>
          </div>
          <div className="offer-hero-stat">
            <span className="offer-hero-stat-value">Up to 50%</span>
            <span className="offer-hero-stat-label">Discount</span>
          </div>
          <div className="offer-hero-stat">
            <span className="offer-hero-stat-value">10K+</span>
            <span className="offer-hero-stat-label">Happy Customers</span>
          </div>
        </div>
      </section>

      <div className="offer-page" id="izu-grid">
        <div className="offer-section-header">
          <h2 className="offer-section-title">Featured Products</h2>
          <p className="offer-section-desc">Handpicked products at the best prices — limited stock available</p>
        </div>

        {loading ? (
          <div className="offer-empty">
            <div className="offer-empty-icon">⏳</div>
            <h3 className="offer-empty-title">Loading Products...</h3>
            <p className="offer-empty-desc">Please wait while we fetch the latest products for you.</p>
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
                        <PercentIcon size={12} /> Save {formatPrice(originalPrice - sellPrice)}
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
          {!showAll && products.length > PAGE_SIZE && (
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 32 }}>
              {hasMore && (
                <button
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
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
          {showAll && products.length > PAGE_SIZE && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button
                onClick={() => { setShowAll(false); setVisibleCount(PAGE_SIZE); }}
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
        ) :
          <div className="offer-empty">
            <div className="offer-empty-icon">🎉</div>
            <h3 className="offer-empty-title">No Products Available Right Now</h3>
            <p className="offer-empty-desc">We don&apos;t have any active products at the moment. Please check back later.</p>
            <a href="/izu_shop" className="offer-empty-btn">Refresh</a>
          </div>
        }
      </div>

      <section className="offer-benefits" id="benefits">
        <div className="offer-benefits-inner">
          {benefits.map((benefit, i) => (
            <div className="offer-benefit-item" key={i}>
              <div className="offer-benefit-icon">{benefit.icon}</div>
              <div>
                <strong>{benefit.label}</strong>
                <span>{benefit.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="offer-cta">
        <div className="offer-cta-content">
          <h2 className="offer-cta-title">Don&apos;t Miss Out on These Deals!</h2>
          <p className="offer-cta-desc">
            Subscribe to our newsletter and be the first to know about exclusive offers and new arrivals.
          </p>
          <form className="offer-cta-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" className="offer-cta-input" required />
            <button type="submit" className="offer-cta-btn">Subscribe</button>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}

/* ─── Root Page export ─── */
export default function IzuShopPage() {
  return <ShopContent />;
}
