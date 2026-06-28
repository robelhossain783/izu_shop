"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
function ChevronLeft() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
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

/* ─── Grid Product Card (for Featured grid) ─── */
function ProductCard({
  product, index, onAddToCart,
}: { product: Product; index: number; onAddToCart: (e: React.MouseEvent, p: Product) => void }) {
  const originalPrice = parseFloat(product.regular_price || "0");
  const sellPrice = parseFloat(product.sell_price || "0");
  const discount = calcDiscount(originalPrice, sellPrice);
  const categoryName =
    typeof product.category === "object" && product.category
      ? (product.category as { name?: string }).name || ""
      : "";
  return (
    <a href={`/product/${product.slug}`} className="pcard">
      {discount > 0 && <div className="pcard-badge">-{discount}%</div>}
      <div className="pcard-img" style={{ background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}12, ${COLORS[index % COLORS.length]}06)` }}>
        {product.image ? (
          <img src={product.image} alt={product.name} className="pcard-img-photo" />
        ) : (
          <>
            <span className="pcard-img-emoji">{EMOJIS[index % EMOJIS.length]}</span>
            {categoryName && <span className="pcard-img-label">{categoryName}</span>}
          </>
        )}
      </div>
      <div className="pcard-body">
        <h4 className="pcard-name">{product.name}</h4>
        <div className="pcard-prices">
          {originalPrice > 0 && <span className="pcard-original">{formatPrice(originalPrice)}</span>}
          <span className="pcard-sell">{formatPrice(sellPrice)}</span>
        </div>
        <div className="pcard-actions">
          <button type="button" className="pcard-btn" onClick={(e) => onAddToCart(e, product)}>
            <CartIcon size={12} /> Add to Cart
          </button>
        </div>
      </div>
    </a>
  );
}

/* ─── Slider Card (for Category row sliders) ─── */
function SliderCard({
  product, index, onAddToCart,
}: { product: Product; index: number; onAddToCart: (e: React.MouseEvent, p: Product) => void }) {
  const originalPrice = parseFloat(product.regular_price || "0");
  const sellPrice = parseFloat(product.sell_price || "0");
  const discount = calcDiscount(originalPrice, sellPrice);
  return (
    <a key={product.id} href={`/product/${product.slug}`} className="category-card">
      {discount > 0 && <div className="category-card-badge">-{discount}%</div>}
      <div className="category-card-img">
        {product.image ? (
          <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
        ) : (
          <span className="offer-card-img-emoji">{EMOJIS[index % EMOJIS.length]}</span>
        )}
      </div>
      <div className="category-card-body">
        <h4 className="category-card-name">{product.name}</h4>
        <div className="category-card-prices">
          {originalPrice > 0 && <span className="category-card-original">{formatPrice(originalPrice)}</span>}
          <span className="category-card-discounted">{formatPrice(sellPrice)}</span>
        </div>
        <div className="offer-card-actions" style={{ marginTop: 4 }}>
          <button type="button" className="offer-card-btn" onClick={(e) => onAddToCart(e, product)}>
            <CartIcon size={13} /> Add to Cart
          </button>
        </div>
      </div>
    </a>
  );
}

/* ─── Category Slider Section ─── */
function CategorySlider({
  slug, name, products, onAddToCart,
}: { slug: string; name: string; products: Product[]; onAddToCart: (e: React.MouseEvent, p: Product) => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function updateState() {
    const el = rowRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    const timer = setTimeout(updateState, 120);
    const onResize = () => updateState();
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(timer); window.removeEventListener("resize", onResize); };
  }, [products]);

  function scrollBy(dir: "left" | "right") {
    const el = rowRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".category-card");
    const style = window.getComputedStyle(el);
    const gap = parseFloat(style.gap || style.columnGap) || 14;
    const amount = (card?.offsetWidth ?? 180) + gap;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    setTimeout(updateState, 350);
  }

  return (
    <section className="shop-section">
      <div className="shop-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="shop-section-title">{name}</h2>
        <a href={`/izu_shop/category/${slug}`} className="cat-view-all-link">
          View All
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </div>

      <div className="cat-slider-wrap">
        {/* Left button */}
        <button
          className="cat-slide-btn cat-slide-left"
          aria-label="Scroll left"
          onClick={() => scrollBy("left")}
          style={{
            opacity: canLeft ? 1 : 0,
            pointerEvents: canLeft ? "auto" : "none",
            transition: "opacity 0.2s",
          }}
        >
          <ChevronLeft />
        </button>

        <div
          className="cat-slider-row"
          ref={rowRef}
          onScroll={updateState}
        >
          {products.map((product, index) => (
            <SliderCard
              key={product.id}
              product={product}
              index={index}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>

        {/* Right button */}
        <button
          className="cat-slide-btn cat-slide-right"
          aria-label="Scroll right"
          onClick={() => scrollBy("right")}
          style={{
            opacity: canRight ? 1 : 0,
            pointerEvents: canRight ? "auto" : "none",
            transition: "opacity 0.2s",
          }}
        >
          <ChevronRight />
        </button>
      </div>

      {/* View All below slider on mobile */}
      <div className="shop-view-all-row">
        <a href={`/izu_shop/category/${slug}`} className="shop-view-all-btn primary">
          View All {name}
        </a>
      </div>
    </section>
  );
}

/* ─── Main Content ─── */
function ShopContent() {
  const { addToCart, openCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    Promise.all([
      fetchProducts(),
      fetch(`${BASE_URL}/api/categories/list/`).then((r) => r.json()).catch(() => []),
    ]).then(([prods, cats]) => {
      const catList = Array.isArray(cats)
        ? cats
        : Array.isArray(cats?.results)
          ? cats.results
          : Array.isArray(cats?.data)
            ? cats.data
            : [];
      setProducts(prods);
      setCategories(catList);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const displayedProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  const productsByCategory = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; products: Product[] }>();
    categories.forEach((cat) => {
      if (cat.slug) map.set(cat.slug, { slug: cat.slug, name: cat.name || cat.slug, products: [] });
    });
    products.forEach((product) => {
      if (typeof product.category === "object" && product.category) {
        const slug = (product.category as { slug?: string }).slug;
        if (slug && map.has(slug)) {
          map.get(slug)!.products.push(product);
        }
      }
    });
    return Array.from(map.values()).filter((g) => g.products.length > 0);
  }, [products, categories]);

  function handleAddToCart(e: React.MouseEvent, product: Product) {
    e.preventDefault();
    e.stopPropagation();
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
        {loading ? (
          <div className="offer-empty" style={{ paddingTop: 60 }}>
            <div className="offer-spinner" />
            <h3 className="offer-empty-title" style={{ marginTop: 20 }}>Loading Products</h3>
            <p className="offer-empty-desc">Please wait while we fetch the latest products for you.</p>
          </div>
        ) : products.length > 0 ? (
          <>
            {/* ── Featured Products — wrapping grid ── */}
            <div className="shop-section">
              <div className="shop-section-header">
                <h2 className="shop-section-title">Featured Products</h2>
              </div>
              <div className="pcard-grid">
                {displayedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
              <div className="shop-view-all-row">
                {hasMore && (
                  <button
                    className="shop-view-all-btn outline"
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                  >
                    See More
                  </button>
                )}
                <a href="/izu_shop/all-products" className="shop-view-all-btn primary">
                  View All Products
                </a>
              </div>
            </div>

            {/* ── Category sections — single-row horizontal slider ── */}
            {productsByCategory.map((group) => (
              <CategorySlider
                key={group.slug}
                slug={group.slug}
                name={group.name}
                products={group.products}
                onAddToCart={handleAddToCart}
              />
            ))}
          </>
        ) : (
          <div className="offer-empty">
            <div className="offer-spinner" />
            <h3 className="offer-empty-title" style={{ marginTop: 20 }}>No Products Available Right Now</h3>
            <p className="offer-empty-desc">We don&apos;t have any active products at the moment. Please check back later.</p>
            <a href="/" className="offer-empty-btn">Refresh</a>
          </div>
        )}
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
