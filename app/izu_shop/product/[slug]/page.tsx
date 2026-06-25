"use client";

import { useEffect, useState, useRef } from "react";
import { useCart } from "../../cart-context";
import { useAuth } from "../../auth-context";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import "../../izu_shop.css";

interface Product {
  id: number; category: any; name: string; slug: string;
  image: string | null; gallery_images?: { id: number; image: string }[];
  reviews?: { id: number; name: string; rating: number; comment: string; created_at: string; avatar_url?: string | null }[];
  description: string; sell_price: string; regular_price: string | null;
  stock: number; is_active: boolean; is_new_arrivals?: boolean;
  created_at: string; badge?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/products/${slug}/`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

async function fetchAllProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/products/list/`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    }
  } catch {}
  return [];
}

function formatPrice(price: number) { return `৳${price.toLocaleString("en-BD")}`; }
function calcDiscount(regular: number, sell: number) {
  if (!regular || regular <= 0) return 0;
  return Math.round(((regular - sell) / regular) * 100);
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: size, color: s <= rating ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
    </span>
  );
}

function ReviewSummary({ reviews }: { reviews: { rating: number }[] }) {
  if (reviews.length === 0) return null;
  const total = reviews.length;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  const distribution = [0, 0, 0, 0, 0];
  reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) distribution[5 - r.rating]++; });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, padding: 20, background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 12, marginBottom: 24, alignItems: "start" }}>
      <div style={{ textAlign: "center", minWidth: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ fontSize: 42, fontWeight: 900, color: "#1a1a1a", lineHeight: 1 }}>{avg.toFixed(1)}</div>
        <StarRating rating={Math.round(avg)} size={18} />
        <div style={{ fontSize: 12, color: "#999", fontWeight: 500 }}>{total} review{total > 1 ? "s" : ""}</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {distribution.map((count, i) => {
          const star = 5 - i;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#555", minWidth: 32 }}>{star} ★</span>
              <div style={{ flex: 1, height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#f59e0b", borderRadius: 4, width: `${pct}%` }} />
              </div>
              <span style={{ fontSize: 11, color: "#999", minWidth: 20, textAlign: "right" }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: () => void }) {
  const sellPrice = Number(product.sell_price || 0);
  const regularPrice = Number(product.regular_price || 0);
  const hasDiscount = regularPrice && regularPrice > sellPrice;
  const imageSrc = product.image
    ? product.image.startsWith("http") ? product.image : `${BASE_URL}${product.image}`
    : null;

  return (
    <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <a href={`/izu_shop/product/${product.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ aspectRatio: "1/1", background: "#f9f9f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, position: "relative", overflow: "hidden" }}>
          {imageSrc ? (
            <>
              <img src={imageSrc} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain", transition: "transform 0.3s" }} />
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.25s", borderRadius: 0 }}
                className="izu-product-card-view"
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "0"; }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 36, height: 36, background: "rgba(255,255,255,0.2)", borderRadius: "50%", padding: 8 }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            </>
          ) : (
            <span style={{ fontSize: 32 }}>📦</span>
          )}
        </div>
        <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#999", marginBottom: 4, textTransform: "uppercase" }}>
            {typeof product.category === "object" && product.category ? product.category.name || "" : ""}
          </p>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 6, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {product.name}
          </h3>
          <div style={{ marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#e8320a" }}>{formatPrice(sellPrice)}</span>
              {hasDiscount && <span style={{ fontSize: 11, color: "#999", textDecoration: "line-through" }}>{formatPrice(regularPrice)}</span>}
            </div>
            <p style={{ fontSize: 11, color: product.stock > 0 ? "#10b981" : "#ef4444", fontWeight: 600, marginTop: 4 }}>
              {product.stock > 0 ? `Stock: ${product.stock}` : "Stock Out"}
            </p>
          </div>
        </div>
      </a>
      <button onClick={onAddToCart} disabled={product.stock <= 0}
        className="offer-card-btn" style={{ borderRadius: 0, marginTop: 0, fontSize: 12 }}>
        {product.stock > 0 ? "Add to Cart" : "Stock Out"}
      </button>
    </div>
  );
}

function ProductDetail({ slug }: { slug: string }) {
  const { addToCart, openCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [lightboxImage, setLightboxImage] = useState("");

  const [activeTab, setActiveTab] = useState<"details" | "specs" | "reviews">("details");
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // Reviews
  const [reviews, setReviews] = useState<{ id: number; name: string; rating: number; comment: string; created_at: string; avatar_url?: string | null }[]>([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [imageZoom, setImageZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProductBySlug(slug).then((data) => {
      setProduct(data);
      if (data?.image) setSelectedImage(data.image);
      if (data?.reviews) setReviews(data.reviews);
      if (user) {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
        setReviewName(fullName);
      }
      setLoading(false);

      // Fetch related products (same category)
      const currentCatId = typeof data?.category === "object" && data?.category ? data.category.id : data?.category || null;
      fetchAllProducts().then((all) => {
        const sameCat = currentCatId ? all.filter((p) => {
          const pCatId = typeof p.category === "object" && p.category ? p.category.id : p.category;
          return pCatId === currentCatId && p.slug !== slug;
        }) : [];
        setRelatedProducts(sameCat.length > 0 ? sameCat.slice(0, 8) : all.filter((p) => p.slug !== slug).slice(0, 8));
      });
    });
  }, [slug, user]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    openCart();
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!inStock) return;
    if (quantity > maxAllowed) return;
    window.location.href = `/izu_shop/checkout/${product.slug}?qty=${quantity}`;
  };

  if (loading) {
    return <><Header /><div style={{ textAlign: "center", padding: "80px 24px" }}><div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div><h3 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>Loading...</h3></div><Footer /></>;
  }

  if (!product) {
    return (
      <><Header />
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", marginBottom: 12 }}>Product Not Found</h3>
          <a href="/izu_shop" style={{ display: "inline-block", background: "#e8320a", color: "#fff", padding: "12px 32px", borderRadius: 12, textDecoration: "none", fontWeight: 700 }}>Back to Shop</a>
        </div>
        <Footer />
      </>
    );
  }

  const originalPrice = parseFloat(product.regular_price || "0");
  const sellPrice = parseFloat(product.sell_price || "0");
  const discount = calcDiscount(originalPrice, sellPrice);
  const maxAllowed = Math.max(1, Math.floor(product.stock * 0.7));
  const inStock = product.stock > 0;

  const tabBtnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 700,
    color: isActive ? "#e8320a" : "#999",
    border: "none",
    borderBottom: isActive ? "2px solid #e8320a" : "2px solid transparent",
    background: "transparent",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  });

  return (
    <>
      <Header />



      <div className="izu-pd-container">
        {/* Breadcrumb */}
        <nav className="izu-pd-breadcrumb">
          <a href="/">Homes</a>
          <span className="izu-pd-breadcrumb-sep">/</span>
          <span className="izu-pd-breadcrumb-current">{product.name}</span>
        </nav>

        {/* Main Grid */}
        <div className="izu-pd-grid">
          {/* Left: Image */}
          <div className="izu-pd-left">
            <div ref={imageRef}
              className="izu-pd-image-sec"
              onMouseEnter={() => setImageZoom(true)}
              onMouseLeave={() => setImageZoom(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setLightboxImage(selectedImage || product.image || "")}>
              {selectedImage ? (
                <img src={selectedImage.startsWith("http") ? selectedImage : `${BASE_URL}${selectedImage}`} alt={product.name}
                  style={imageZoom ? { transform: "scale(1.8)", transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined} />
              ) : (
                <div style={{ fontSize: 48, color: "#ccc" }}>📦</div>
              )}
            </div>
            {(product.gallery_images && product.gallery_images.length > 0 || product.image) && (
              <div className="izu-pd-gallery">
                {[product.image, ...(product.gallery_images || []).map((g) => g.image)].filter(Boolean).map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(img!)}
                    className={`izu-pd-gallery-btn ${selectedImage === img ? "active" : ""}`}>
                    <img src={img!.startsWith("http") ? img! : `${BASE_URL}${img!}`} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div>
            {product.badge && <span className="izu-pd-badge">{product.badge}</span>}
            <h1 className="izu-pd-name">{product.name}</h1>

            {/* Rating */}
            <div className="izu-pd-rating">
              <StarRating rating={reviews.length > 0 ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0} />
              <span style={{ fontSize: 12, color: "#999" }}>
                {reviews.length > 0
                  ? `${(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} (${reviews.length} review${reviews.length > 1 ? "s" : ""})`
                  : "No reviews yet"}
              </span>
            </div>

            {/* Price */}
            <div className="izu-pd-price-row">
              <span className="izu-pd-current-price">{formatPrice(sellPrice)}</span>
              {originalPrice > 0 && <>
                <span className="izu-pd-old-price">{formatPrice(originalPrice)}</span>
                <span className="izu-pd-discount-badge">-{discount}%</span>
              </>}
            </div>

            {/* Stock */}
            <div className={`izu-pd-stock ${inStock ? "in" : "out"}`}>
              <span className={`izu-pd-dot ${inStock ? "in" : "out"}`} />
              {inStock ? `In Stock (${product.stock} available)` : "Stock Out"}
            </div>

            {/* Description */}
            <p className="izu-pd-desc">
              {product.description || "No description available."}
            </p>

            {/* Quantity + Actions */}
            {inStock && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <span className="izu-pd-qty-label">Quantity:</span>
                <div className="izu-pd-qty-control">
                  <button className="izu-pd-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <input type="number" value={quantity} readOnly className="izu-pd-qty-input" />
                  <button className="izu-pd-qty-btn" onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}>+</button>
                </div>
              </div>
            )}

            <div className="izu-pd-actions">
              <button onClick={handleAddToCart} disabled={!inStock} className="izu-pd-cart-btn">
                🛒 Add to Cart
              </button>
              <button onClick={handleBuyNow} disabled={!inStock} className="izu-pd-buy-btn">
                Buy Now
              </button>
            </div>

            <a href={`https://wa.me/8801635275630?text=Hi, I'm interested in "${product.name}" (${formatPrice(sellPrice)})`}
              target="_blank" rel="noopener noreferrer" className="izu-pd-whatsapp">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.76-1.653-2.059-.173-.3-.018-.462.13-.61.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Order via WhatsApp
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", borderBottom: "2px solid #e8e8e8", marginBottom: 20, overflowX: "auto" }}>
            <button onClick={() => setActiveTab("details")} style={tabBtnStyle(activeTab === "details")}>Description</button>
            <button onClick={() => setActiveTab("specs")} style={tabBtnStyle(activeTab === "specs")}>Specifications</button>
            <button onClick={() => setActiveTab("reviews")} style={tabBtnStyle(activeTab === "reviews")}>Reviews ({reviews.length})</button>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 8, padding: 24, minHeight: 150 }}>
            {activeTab === "details" && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>Product Overview</h3>
                <p style={{ lineHeight: 1.7, color: "#555" }}>{product.description || "No description available."}</p>
              </div>
            )}

            {activeTab === "specs" && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {[
                    ["Product Name", product.name],
                    ["Category", typeof product.category === "object" && product.category ? product.category.name || "" : ""],
                    ["Price", `৳${sellPrice}${originalPrice > 0 ? ` (Regular: ৳${originalPrice})` : ""}`],
                    ["Stock", inStock ? `In Stock (${product.stock} units)` : "Out of Stock"],
                    ["Product Code", `#PRD-${product.id}`],
                  ].map(([label, value], i) => (
                    <tr key={i}>
                      <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0", fontWeight: 700, color: "#555", width: 200, fontSize: 13.5 }}>{label}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #f0f0f0", color: "#1a1a1a", fontSize: 13.5 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "reviews" && (
              <div>
                <ReviewSummary reviews={reviews} />

                {reviews.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {reviews.map((review) => (
                      <div key={review.id} style={{ borderBottom: "1px solid #f0f0f0", padding: "16px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #4f8ef7, #2563eb)", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                            {review.avatar_url ? (
                              <img src={review.avatar_url.startsWith("http") ? review.avatar_url : `${BASE_URL}${review.avatar_url}`} alt={review.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                            ) : review.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{review.name}</div>
                            <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>{new Date(review.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 1, marginBottom: 4 }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} style={{ fontSize: 14, color: s <= review.rating ? "#f59e0b" : "#d1d5db" }}>★</span>
                          ))}
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#555", margin: 0 }}>{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "32px 20px", color: "#999", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "#f8f9fa", borderRadius: 8, border: "1px dashed #e5e7eb" }}>
                    <span style={{ fontSize: 40 }}>💬</span>
                    <p>No reviews yet. Be the first to share your experience!</p>
                  </div>
                )}

                {/* Review Form */}
                <div style={{ background: "#f8f9fa", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginTop: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>Write a Review</h3>
                  {!user ? (
                    <div style={{ textAlign: "center", padding: "24px 16px", background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8 }}>
                      <p style={{ fontSize: 13, color: "#555", fontWeight: 500, marginBottom: 12 }}>Please login to write a review.</p>
                      <a href="/izu_shop/auth" style={{ display: "inline-block", background: "#e8320a", color: "#fff", border: "none", borderRadius: 6, padding: "9px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>Login</a>
                    </div>
                  ) : (
                    <>
                      {reviewSuccess && <div style={{ padding: "10px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, marginBottom: 14, background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }}>{reviewSuccess}</div>}
                      {reviewError && <div style={{ padding: "10px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, marginBottom: 14, background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}>{reviewError}</div>}
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!reviewName.trim() || !reviewComment.trim()) { setReviewError("Please fill in your name and comment."); return; }
                        setReviewSubmitting(true);
                        setReviewError("");
                        setReviewSuccess("");
                        try {
                          const res = await fetch(`${BASE_URL}/api/products/${product.id}/reviews/add/`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: reviewName, rating: reviewRating, comment: reviewComment, user_id: user?.id }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setReviews((prev) => [data.review, ...prev]);
                            setReviewComment("");
                            setReviewRating(5);
                            setReviewSuccess("Thank you! Your review has been submitted.");
                          } else {
                            const err = await res.json();
                            setReviewError(err?.comment?.[0] || err?.name?.[0] || "Failed to submit review.");
                          }
                        } catch { setReviewError("Network error. Please try again."); }
                        finally { setReviewSubmitting(false); }
                      }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Posting as</label>
                            <input type="text" value={reviewName} readOnly style={{ height: 38, border: "1.5px solid #d1d5db", borderRadius: 6, padding: "0 12px", fontSize: 13, color: "#555", background: "#f3f4f6", cursor: "default", outline: "none" }} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Your Rating</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button key={s} type="button" onClick={() => setReviewRating(s)} onMouseEnter={() => setReviewHover(s)} onMouseLeave={() => setReviewHover(0)}
                                  style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: s <= (reviewHover || reviewRating) ? "#f59e0b" : "#d1d5db", padding: "0 1px", lineHeight: 1 }}>★</button>
                              ))}
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#999", marginLeft: 6 }}>{reviewHover || reviewRating}/5</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Your Review</label>
                          <textarea placeholder="Share your experience..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={4} required
                            style={{ border: "1.5px solid #d1d5db", borderRadius: 6, padding: "10px 12px", fontSize: 13, color: "#1a1a1a", background: "#fff", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, minHeight: 80 }} />
                        </div>
                        <button type="submit" disabled={reviewSubmitting}
                          style={{ alignSelf: "flex-start", background: "#e8320a", color: "#fff", border: "none", borderRadius: 6, padding: "10px 28px", fontSize: 13, fontWeight: 600, cursor: reviewSubmitting ? "not-allowed" : "pointer", opacity: reviewSubmitting ? 0.6 : 1 }}>
                          {reviewSubmitting ? "Submitting..." : "Submit Review"}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", position: "relative", paddingLeft: 12 }}>
                <span style={{ position: "absolute", left: 0, top: 3, bottom: 3, width: 4, background: "#e8320a", borderRadius: 2 }} />
                Related Products
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={() => { addToCart(p); openCart(); }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Lightbox */}
      {lightboxImage && (
        <div onClick={() => setLightboxImage("")} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}>
          <button onClick={() => setLightboxImage("")} style={{ position: "absolute", top: 20, right: 24, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, cursor: "pointer", backdropFilter: "blur(4px)" }}>
            ✕
          </button>
          <img src={lightboxImage.startsWith("http") ? lightboxImage : `${BASE_URL}${lightboxImage}`} alt=""
            style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

import { use } from "react";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <ProductDetail slug={slug} />;
}
