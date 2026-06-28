"use client";

import { useEffect, useState } from "react";
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
    <div className="izu-review-summary" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, padding: 20, background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 12, marginBottom: 24, alignItems: "start" }}>
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
      <a href={`/product/${product.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ aspectRatio: "4/5", background: "#f9f9f9", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {imageSrc ? (
            <img src={imageSrc} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} />
          ) : (
            <span style={{ fontSize: 32 }}>📦</span>
          )}
        </div>
        <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", margin: 0 }}>
            {product.name}
          </h3>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#e8320a" }}>{formatPrice(sellPrice)}</span>
            {hasDiscount && <span style={{ fontSize: 12, color: "#999", textDecoration: "line-through" }}>{formatPrice(regularPrice)}</span>}
          </div>
        </div>
      </a>
      <div style={{ display: "flex", gap: 6, padding: "0 10px 10px" }}>
        <button onClick={onAddToCart} disabled={product.stock <= 0}
          className="offer-card-btn">
          {product.stock > 0 ? "Add to Cart" : "Stock Out"}
        </button>
      </div>
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
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

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

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    openCart();
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!inStock) return;
    if (quantity > maxAllowed) return;
    window.location.href = `/checkout/${product.slug}?qty=${quantity}`;
  };

  if (loading) {
    return <><Header /><div className="offer-empty" style={{ paddingTop: 80 }}><div className="offer-spinner" /><h3 className="offer-empty-title" style={{ marginTop: 20 }}>Loading Product</h3></div><Footer /></>;
  }

  if (!product) {
    return (
      <><Header />
        <div className="offer-empty">
          <div className="offer-empty-icon">
            <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="28" stroke="#d4d4d4" strokeWidth="2.5" fill="#f9f9f9"/>
              <path d="M32 32l16 16M48 32l-16 16" stroke="#e0e0e0" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="56" cy="56" r="14" fill="#fef2f0" stroke="#e8320a" strokeWidth="2"/>
              <path d="M52 56h8M56 52v8" stroke="#e8320a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 className="offer-empty-title">Product Not Found</h3>
          <p className="offer-empty-desc">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <a href="/" className="offer-empty-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10"/></svg>
            Back to Shop
          </a>
        </div>
        <Footer />
      </>
    );
  }

  const originalPrice = parseFloat(product.regular_price || "0");
  const sellPrice = parseFloat(product.sell_price || "0");
  const maxAllowed = Math.max(1, Math.floor(product.stock * 0.7));
  const inStock = product.stock > 0;

  const tabBtnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: isActive ? 700 : 500,
    color: isActive ? "#1a1a1a" : "#999",
    border: "none",
    borderBottom: isActive ? "2px solid #e8320a" : "2px solid transparent",
    background: "transparent",
    cursor: "pointer",
    whiteSpace: "nowrap",
    marginBottom: -1,
    transition: "all 0.15s",
  });

  return (
    <>
      <Header />

      <div className="izu-pd-container">
        {/* Breadcrumb */}
        <nav className="izu-pd-breadcrumb">
          <a href="/" style={{ display: "inline-flex", alignItems: "center", color: "inherit", textDecoration: "none" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" /></svg>
          </a>
          <span className="izu-pd-breadcrumb-sep">/</span>
          <span className="izu-pd-breadcrumb-current">{product.name}</span>
        </nav>

        {/* Main Grid */}
        <div className="izu-pd-grid">
          {/* Left: Image */}
          <div className="izu-pd-left">
            <div className="izu-pd-image-sec"
              onClick={() => setLightboxImage(selectedImage || product.image || "")}>
              {selectedImage ? (
                <img src={selectedImage.startsWith("http") ? selectedImage : `${BASE_URL}${selectedImage}`} alt={product.name} />
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
            <h1 className="izu-pd-name">{product.name}</h1>

            {/* Info Table (Status, Condition, Category) */}
            <table className="izu-pd-info-table">
              <tbody>
                <tr><td>Status</td><td>{inStock ? "In Stock" : "Stock Out"}</td></tr>
                <tr><td>Condition</td><td>New</td></tr>
                {typeof product.category === "object" && product.category && (
                  <tr><td>Category</td><td><a href={`/category/${product.category.slug}`}>{product.category.name}</a></td></tr>
                )}
              </tbody>
            </table>

            {/* Price */}
            <div className="izu-pd-price-row">
              <span className="izu-pd-current-price">{formatPrice(sellPrice)}</span>
              {originalPrice > 0 && <span className="izu-pd-old-price">{formatPrice(originalPrice)}</span>}
            </div>

            <hr className="izu-pd-divider" />

            {/* Description */}
            <p className="izu-pd-desc">
              {product.description || "No description available."}
            </p>

            {/* Color Variant */}
            <div className="izu-pd-variant">
              <div className="izu-pd-variant-label">Color :</div>
              <div className="izu-pd-color-options">
                {[
                  { name: "Black", hex: "#000000" },
                  { name: "White", hex: "#ffffff" },
                  { name: "Navy Blue", hex: "#1a237e" },
                  { name: "Gray", hex: "#808080" },
                ].map((c) => (
                  <button key={c.name} onClick={() => setSelectedColor(c.name)}
                    className={`izu-pd-color-btn ${selectedColor === c.name ? "active" : ""}`}>
                    <span className="izu-pd-color-swatch" style={{ background: c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Variant */}
            <div className="izu-pd-variant">
              <div className="izu-pd-variant-label">Size :</div>
              <div className="izu-pd-size-options">
                {["M", "L", "XL", "XXL"].map((s) => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`izu-pd-size-btn ${selectedSize === s ? "active" : ""}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <hr className="izu-pd-divider" />

            {/* Quantity */}
            {inStock && (
              <div className="izu-pd-qty">
                <span className="izu-pd-qty-label">Quantity:</span>
                <div className="izu-pd-qty-control">
                  <button className="izu-pd-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <input type="number" value={quantity} readOnly className="izu-pd-qty-input" />
                  <button className="izu-pd-qty-btn" onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}>+</button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="izu-pd-actions">
              <button onClick={handleAddToCart} disabled={!inStock} className="izu-pd-cart-btn">
                Add to Cart
              </button>
              <button onClick={handleBuyNow} disabled={!inStock} className="izu-pd-buy-btn">
                Buy Now
              </button>
            </div>

            <a href={`https://wa.me/8801635275630?text=Hi, I'm interested in "${product.name}" (${formatPrice(sellPrice)})`}
              target="_blank" rel="noopener noreferrer" className="izu-pd-whatsapp">
              Order via WhatsApp
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="izu-pd-tabs" style={{ marginBottom: 40 }}>
          <div className="izu-pd-tab-bar" style={{ display: "flex", borderBottom: "1px solid #e8e8e8", marginBottom: 20, overflowX: "auto" }}>
            <button onClick={() => setActiveTab("details")} className="izu-pd-tab-btn" style={tabBtnStyle(activeTab === "details")}>Description</button>
            <button onClick={() => setActiveTab("reviews")} className="izu-pd-tab-btn" style={tabBtnStyle(activeTab === "reviews")}>Reviews ({reviews.length})</button>
          </div>

          <div style={{ minHeight: 150 }}>
            {activeTab === "details" && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>Description</h3>
                <p style={{ lineHeight: 1.7, color: "#555" }}>{product.description || "No description available."}</p>
              </div>
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
                  <div className="izu-review-empty" style={{ textAlign: "center", padding: "32px 20px", color: "#999", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "#f8f9fa", borderRadius: 8, border: "1px dashed #e5e7eb" }}>
                    <span style={{ fontSize: 40 }}>💬</span>
                    <p>No reviews yet. Be the first to share your experience!</p>
                  </div>
                )}

                {/* Review Form */}
                <div className="izu-review-form-box" style={{ background: "#f8f9fa", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginTop: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>Write a Review</h3>
                  {!user ? (
                    <div style={{ textAlign: "center", padding: "24px 16px", background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8 }}>
                      <p style={{ fontSize: 13, color: "#555", fontWeight: 500, marginBottom: 12 }}>Please login to write a review.</p>
                      <a href="/auth" style={{ display: "inline-block", background: "#e8320a", color: "#fff", border: "none", borderRadius: 6, padding: "9px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>Login</a>
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
                        <div className="izu-review-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
              <h2 className="izu-related-title" style={{ margin: 0 }}>
                <span style={{ display: "inline-block", width: 4, height: 20, background: "#e8320a", borderRadius: 2, marginRight: 10, verticalAlign: "middle" }} />
                Related Products
              </h2>
            </div>
            <div className="izu-related-row">
              {relatedProducts.map((p) => (
                <div key={p.id} className="izu-related-card-wrap">
                  <ProductCard product={p} onAddToCart={() => { addToCart(p); openCart(); }} />
                </div>
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
