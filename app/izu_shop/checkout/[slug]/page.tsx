"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "../../cart-context";
import { useAuth } from "../../auth-context";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import "../../izu_shop.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

interface Product {
  id: number; name: string; slug: string; image: string | null;
  sell_price: string; regular_price: string | null; stock: number;
  description: string; category: any;
  is_active: boolean; is_new_arrivals?: boolean; created_at: string;
  badge?: string;
}

function CheckoutContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { clearCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  // Form states
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [district, setDistrict] = useState("Dhaka");
  const [address, setAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccessMsg, setCouponSuccessMsg] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [onlineMethod, setOnlineMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const receiverNumber = "01635275630";

  // Order state
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shipping Address Options
  const [addressOption, setAddressOption] = useState<"profile" | "new">("new");
  const hasProfileAddress = !!(user && (user.address || user.phone));

  const nameDisabled = addressOption === "profile" && !!(user?.first_name || user?.last_name || user?.username);
  const phoneDisabled = addressOption === "profile" && !!user?.phone;
  const addressDisabled = addressOption === "profile" && !!user?.address;

  useEffect(() => {
    if (user) {
      if (user.address || user.phone) {
        setAddressOption("profile");
      } else {
        setAddressOption("new");
      }
    } else {
      setAddressOption("new");
    }
  }, [user]);

  useEffect(() => {
    if (user && addressOption === "profile") {
      const profileName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "";
      if (profileName) setFullName(profileName);
      if (user.phone) setMobileNumber(user.phone);
      if (user.address) setAddress(user.address);
    } else if (addressOption === "new") {
      setFullName("");
      setMobileNumber("");
      setAddress("");
    }
  }, [addressOption, user]);

  useEffect(() => {
    if (!slug) return;
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/products/${slug}/`, { cache: "no-store" });
        const data = await res.json();
        setProduct(data);
        const qtyParam = searchParams.get("qty");
        const qtyVal = qtyParam ? parseInt(qtyParam, 10) : 1;
        setQty(qtyVal > 0 ? qtyVal : 1);
      } catch (err) {
        console.error("Error loading checkout product:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug, searchParams]);

  if (loading) {
    return (
      <div className="product-details-container" style={{ textAlign: "center", padding: "120px 0" }}>
        <div className="checkout-spinner"></div>
        <h2 style={{ fontWeight: "600", color: "var(--text-secondary)" }}>Loading secure checkout...</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-details-container" style={{ textAlign: "center", padding: "100px 16px" }}>
        <h2 style={{ fontSize: "24px", color: "var(--primary)", marginBottom: "8px" }}>Checkout Error</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>The selected product could not be loaded for checkout.</p>
        <a href="/izu_shop" style={{ background: "var(--primary)", color: "#fff", padding: "10px 24px", borderRadius: "var(--radius)", fontWeight: "600", textDecoration: "none", display: "inline-block" }}>
          Back to Home
        </a>
      </div>
    );
  }

  const unitPrice = Number(product.sell_price);
  const subtotal = unitPrice * qty;
  const deliveryCharge = district.toLowerCase() === "dhaka" ? 80 : 150;

  const handleApplyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccessMsg("");

    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    if (code === "SAVE10") {
      const discount = Math.round(subtotal * 0.1);
      setDiscountAmount(discount);
      setCouponApplied(true);
      setCouponSuccessMsg(`Success! 10% discount of ৳${discount} applied.`);
    } else if (code === "BF10") {
      const discount = Math.min(100, subtotal);
      setDiscountAmount(discount);
      setCouponApplied(true);
      setCouponSuccessMsg(`Success! Flat ৳${discount} discount applied.`);
    } else if (code === "FREESHIP") {
      setDiscountAmount(deliveryCharge);
      setCouponApplied(true);
      setCouponSuccessMsg("Success! Free shipping discount applied.");
    } else {
      setCouponError("Invalid coupon code! Try SAVE10 or BF10.");
      setDiscountAmount(0);
      setCouponApplied(false);
    }
  };

  const grandTotal = Math.max(0, subtotal - discountAmount + (couponCode.trim().toUpperCase() === "FREESHIP" ? 0 : deliveryCharge));

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !mobileNumber || !address || !district) {
      alert("⚠️ Please fill in all required shipping fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${BASE_URL}/api/create-order/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "buy_now",
          product_id: product.id,
          quantity: qty,
          full_name: fullName,
          phone: mobileNumber,
          address: `${address}, ${district}`,
          payment_type: paymentMethod === "ONLINE" ? `ONLINE_${onlineMethod.toUpperCase()}` : paymentMethod.toUpperCase(),
          transaction_id: paymentMethod === "ONLINE" ? transactionId : "",
          delivery_charge: deliveryCharge,
          ...(user ? { user_id: user.id } : {}),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to create order on backend.");
      }

      const data = await response.json();
      const confirmedOrderId = data.order_id || `ORDER-${data.id}`;
      setOrderId(confirmedOrderId);
      setOrderPlaced(true);

      try {
        const savedOrders = JSON.parse(localStorage.getItem("izu_shop_orders") || "[]");
        const newOrder = {
          order_id: confirmedOrderId,
          fullName,
          phone: mobileNumber,
          address: `${address}, ${district}`,
          paymentMethod: paymentMethod === "ONLINE" ? `ONLINE_${onlineMethod.toUpperCase()}` : paymentMethod.toUpperCase(),
          transaction_id: paymentMethod === "ONLINE" ? transactionId : "",
          product_name: product.name,
          product_image: product.image,
          quantity: qty,
          amount: grandTotal,
          status: "pending",
          created_at: new Date().toISOString(),
        };
        localStorage.setItem("izu_shop_orders", JSON.stringify([newOrder, ...savedOrders]));
      } catch {}

      clearCart();
    } catch (err: any) {
      alert(`Order placement failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const buyWidth = doc.getTextWidth("BUY");
    const festWidth = doc.getTextWidth("FEST");
    const totalWidth = buyWidth + festWidth;
    const startX = (pageWidth - totalWidth) / 2;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(22, 73, 214);
    doc.text("BUY", startX, 20);
    doc.setTextColor(255, 87, 34);
    doc.text("FEST", startX + buyWidth, 20);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("www.buyfestbd.com", 105, 26, { align: "center" });

    doc.setDrawColor(200, 200, 200);
    doc.line(15, 32, 195, 32);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(33, 33, 33);
    doc.text("ORDER RECEIPT", 15, 42);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Order Reference: ${orderId}`, 15, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 56);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(33, 33, 33);
    doc.text("Shipping & Customer Details", 15, 68);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Customer Name: ${fullName}`, 15, 76);
    doc.text(`Mobile Number: ${mobileNumber}`, 15, 82);
    doc.text(`Delivery Address: ${address}, ${district}`, 15, 88);
    const paymentLabel = paymentMethod === "COD" ? "Cash on Delivery" : paymentMethod === "ONLINE" ? `Online (${onlineMethod.toUpperCase()})` : paymentMethod;
    doc.text(`Payment Method: ${paymentLabel}`, 15, 94);

    doc.line(15, 102, 195, 102);
    doc.setFont("Helvetica", "bold");
    doc.text("Item Details", 15, 108);
    doc.text("Qty", 150, 108, { align: "center" });
    doc.text("Price", 185, 108, { align: "right" });
    doc.line(15, 112, 195, 112);

    doc.setFont("Helvetica", "normal");
    doc.text(product.name, 15, 120);
    doc.text(String(qty), 150, 120, { align: "center" });
    doc.text(`BDT ${(unitPrice * qty).toFixed(2)}`, 185, 120, { align: "right" });
    doc.line(15, 126, 195, 126);

    doc.text("Delivery Charge:", 130, 134);
    doc.text(`BDT ${deliveryCharge.toFixed(2)}`, 185, 134, { align: "right" });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Total Paid:", 130, 142);
    doc.text(`BDT ${grandTotal.toFixed(2)}`, 185, 142, { align: "right" });

    doc.setFont("Helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for shopping with www.buyfestbd.com", 105, 165, { align: "center" });

    doc.save("order-receipt.pdf");
  };

  return (
    <div className="checkout-page-root" style={{ background: "#fafafa", minHeight: "80vh", padding: "32px 0 60px" }}>
        <div className="container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 16px" }}>
          {orderPlaced ? (
            <div style={{ maxWidth: "650px", margin: "40px auto", padding: "40px 24px", background: "#fff", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 8px 30px rgba(0,0,0,0.05)", textAlign: "center" }}>
              <span style={{ fontSize: "72px", display: "block", marginBottom: "16px" }}>🎉</span>
              <h2 style={{ fontSize: "30px", fontWeight: "800", color: "#2e7d32", marginBottom: "12px" }}>Order Confirmed!</h2>
              <p style={{ fontSize: "16px", color: "var(--text-secondary)", marginBottom: "32px" }}>
                Thank you for your order, <strong>{fullName}</strong>. Your order has been registered successfully.
              </p>

              <div style={{ background: "#f8f9fa", borderRadius: "8px", padding: "20px", textAlign: "left", marginBottom: "32px", border: "1px solid #eee" }}>
                <h4 style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "12px" }}>Order Specifications</h4>
                <p style={{ margin: "6px 0", fontSize: "14px" }}><strong>Order Reference:</strong> <span style={{ color: "var(--primary)", fontWeight: "700" }}>{orderId}</span></p>
                <p style={{ margin: "6px 0", fontSize: "14px" }}><strong>Item Purchased:</strong> {product.name} (Qty: {qty})</p>
                <p style={{ margin: "6px 0", fontSize: "14px" }}><strong>Mobile Number:</strong> {mobileNumber}</p>
                <p style={{ margin: "6px 0", fontSize: "14px" }}><strong>Shipping Address:</strong> {address}, {district}</p>
                <p style={{ margin: "6px 0", fontSize: "14px" }}><strong>Payment Method:</strong> {paymentMethod === "COD" ? "Cash on Delivery" : `Online (${onlineMethod.toUpperCase()})`}</p>
                {transactionId && <p style={{ margin: "6px 0", fontSize: "14px" }}><strong>Transaction ID:</strong> {transactionId}</p>}
                <p style={{ margin: "6px 0", fontSize: "14px" }}><strong>Total Payable:</strong> ৳{grandTotal}</p>
              </div>

              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={handleDownloadReceipt}
                  style={{ background: "#4caf50", color: "#fff", border: "none", padding: "12px 30px", borderRadius: "30px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px" }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(0.9)"}
                  onMouseLeave={(e) => e.currentTarget.style.filter = "none"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Download Receipt
                </button>
                <a href="/izu_shop" style={{ background: "var(--primary)", color: "#fff", textDecoration: "none", padding: "12px 30px", borderRadius: "30px", fontWeight: "700", transition: "all 0.2s", display: "inline-flex", alignItems: "center" }} onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(0.9)"} onMouseLeave={(e) => e.currentTarget.style.filter = "none"}>
                  Continue Shopping
                </a>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "32px" }} className="checkout-grid">
              {/* LEFT SIDE: ORDER FORM */}
              <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--border)", padding: "28px", boxShadow: "var(--shadow-sm)" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "2px solid var(--border-light)", paddingBottom: "12px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  Shipping & Billing Information
                </h2>

                <form onSubmit={handlePlaceOrder}>
                  {hasProfileAddress && (
                    <div style={{ marginBottom: "20px", padding: "14px", background: "#f0f7ff", border: "1px solid #bae7ff", borderRadius: "8px" }}>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#0050b3", marginBottom: "8px", letterSpacing: "0.5px" }}>
                        Delivery Destination Option
                      </label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", cursor: "pointer" }}>
                          <input type="radio" name="addressOption" checked={addressOption === "profile"} onChange={() => setAddressOption("profile")} />
                          Profile Shipping Address
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", cursor: "pointer" }}>
                          <input type="radio" name="addressOption" checked={addressOption === "new"} onChange={() => setAddressOption("new")} />
                          New Address
                        </label>
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>Full Name *</label>
                    <input
                      type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name" disabled={nameDisabled}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none", transition: "all 0.2s", background: nameDisabled ? "#f5f5f5" : "#fff", cursor: nameDisabled ? "not-allowed" : "text", color: nameDisabled ? "#666" : "var(--text-primary)", boxSizing: "border-box" }}
                      onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                      onBlur={(e) => e.target.style.borderColor = "#ddd"}
                    />
                  </div>

                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>Mobile Number *</label>
                    <input
                      type="tel" required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Enter 11-digit mobile number" pattern="[0-9]{11}" title="Please enter a valid 11-digit phone number" disabled={phoneDisabled}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none", background: phoneDisabled ? "#f5f5f5" : "#fff", cursor: phoneDisabled ? "not-allowed" : "text", color: phoneDisabled ? "#666" : "var(--text-primary)", boxSizing: "border-box" }}
                      onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                      onBlur={(e) => e.target.style.borderColor = "#ddd"}
                    />
                  </div>

                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>District *</label>
                    <select
                      value={district} onChange={(e) => setDistrict(e.target.value)}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", background: "#fff", cursor: "pointer", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                      onBlur={(e) => e.target.style.borderColor = "#ddd"}
                    >
                      <option value="Dhaka">Dhaka (Delivery Charge: ৳80)</option>
                      <option value="Chattogram">Chattogram (Delivery Charge: ৳150)</option>
                      <option value="Sylhet">Sylhet (Delivery Charge: ৳150)</option>
                      <option value="Rajshahi">Rajshahi (Delivery Charge: ৳150)</option>
                      <option value="Barishal">Barishal (Delivery Charge: ৳150)</option>
                      <option value="Khulna">Khulna (Delivery Charge: ৳150)</option>
                      <option value="Rangpur">Rangpur (Delivery Charge: ৳150)</option>
                      <option value="Mymensingh">Mymensingh (Delivery Charge: ৳150)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>Full Address *</label>
                    <textarea
                      required value={address} onChange={(e) => setAddress(e.target.value)}
                      placeholder="Village/Area, House No, Road, Flat Number, Landmarks" rows={3} disabled={addressDisabled}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", fontFamily: "inherit", resize: "none", outline: "none", background: addressDisabled ? "#f5f5f5" : "#fff", cursor: addressDisabled ? "not-allowed" : "text", color: addressDisabled ? "#666" : "var(--text-primary)", boxSizing: "border-box" }}
                      onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                      onBlur={(e) => e.target.style.borderColor = "#ddd"}
                    />
                  </div>

                  {/* Coupon */}
                  <div style={{ background: "#fdf8f6", border: "1px dashed #ffccc7", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "var(--primary)" }}>🏷️ Apply Coupon Code</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text" placeholder="e.g. enter coupon code if have" value={couponCode} onChange={(e) => setCouponCode(e.target.value)}
                        style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px", textTransform: "uppercase", outline: "none" }}
                      />
                      <button type="button" onClick={handleApplyCoupon}
                        style={{ background: "var(--primary)", color: "#fff", fontWeight: "700", padding: "0 18px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", transition: "all 0.2s", border: "none" }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(0.95)"}
                        onMouseLeave={(e) => e.currentTarget.style.filter = "none"}
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p style={{ color: "#d43f3a", fontSize: "12px", fontWeight: "600", marginTop: "6px" }}>{couponError}</p>}
                    {couponSuccessMsg && <p style={{ color: "#389e0d", fontSize: "12px", fontWeight: "600", marginTop: "6px" }}>{couponSuccessMsg}</p>}
                  </div>

                  {/* Payment */}
                  <div style={{ marginBottom: "28px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "10px", color: "var(--text-secondary)" }}>Payment Method</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: "1px solid #ddd", borderRadius: "8px", cursor: "pointer", background: paymentMethod === "COD" ? "#fdfbfb" : "#fff", borderColor: paymentMethod === "COD" ? "var(--primary)" : "#ddd" }}>
                        <input type="radio" name="payment" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
                        <div>
                          <strong style={{ fontSize: "14px", display: "block" }}>Cash on Delivery (COD)</strong>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Pay with cash upon delivery</span>
                        </div>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: "1px solid #ddd", borderRadius: "8px", cursor: "pointer", background: paymentMethod === "ONLINE" ? "#fdfbfb" : "#fff", borderColor: paymentMethod === "ONLINE" ? "var(--primary)" : "#ddd" }}>
                        <input type="radio" name="payment" checked={paymentMethod === "ONLINE"} onChange={() => { setPaymentMethod("ONLINE"); setOnlineMethod(""); setTransactionId(""); }} />
                        <div>
                          <strong style={{ fontSize: "14px", display: "block" }}>Online Payment</strong>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Pay via bKash / Nagad / Rocket / Upay</span>
                        </div>
                      </label>
                      {paymentMethod === "ONLINE" && (
                        <div style={{ padding: "16px", background: "#fafafa", borderRadius: "8px", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: "14px" }}>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>Select your payment method:</p>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            {[
                              { id: "bkash", label: "bKash", color: "#E2136E" },
                              { id: "nagad", label: "Nagad", color: "#F5821F" },
                              { id: "rocket", label: "Rocket", color: "#ED1C24" },
                              { id: "upay", label: "Upay", color: "#0EA5E9" },
                            ].map((m) => (
                              <button key={m.id} type="button" onClick={() => setOnlineMethod(m.id)}
                                style={{ padding: "10px", borderRadius: "8px", border: onlineMethod === m.id ? `2px solid ${m.color}` : "1px solid var(--border)", background: onlineMethod === m.id ? "#fff" : "#fff", fontWeight: onlineMethod === m.id ? "700" : "500", color: onlineMethod === m.id ? m.color : "var(--text-secondary)", cursor: "pointer", fontSize: "13px", transition: "all 0.2s" }}>
                                {m.label}
                              </button>
                            ))}
                          </div>
                          {onlineMethod && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--border)" }}>
                              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Make Payment or Cash out</p>
                              <p style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "1px" }}>{receiverNumber}</p>
                              <div style={{ borderTop: "1px dashed var(--border-light)", paddingTop: "10px" }}>
                                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Transaction ID</label>
                                <input type="text" placeholder="Enter your transaction ID" value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                                  required={paymentMethod === "ONLINE"} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit" disabled={isSubmitting}
                    style={{ width: "100%", background: isSubmitting ? "#888" : "#ff5500", color: "#fff", fontSize: "16px", fontWeight: "800", padding: "14px 20px", borderRadius: "30px", cursor: isSubmitting ? "not-allowed" : "pointer", transition: "all 0.2s", border: "none", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                    onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.transform = "translateY(-1px)")}
                    onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.transform = "none")}
                  >
                    {isSubmitting ? (
                      <><div className="checkout-spinner" style={{ width: "18px", height: "18px", border: "2px solid #fff", borderTop: "2px solid transparent", margin: 0 }}></div> Processing Order...</>
                    ) : (
                      <> Place Order (৳{grandTotal})</>
                    )}
                  </button>
                </form>
              </div>

              {/* RIGHT SIDE: ORDER SUMMARY */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--border)", padding: "24px", boxShadow: "var(--shadow-sm)", position: "sticky", top: "24px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", color: "var(--text-primary)" }}>
                    🛍️ Order Summary
                  </h3>

                  <div style={{ display: "flex", gap: "12px", marginBottom: "18px", paddingBottom: "16px", borderBottom: "1px solid #f5f5f5" }}>
                    <div style={{ width: "70px", height: "70px", background: "#f8f9fa", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #eee", flexShrink: 0 }}>
                      {product.image ? (
                        <img src={product.image.startsWith("http") ? product.image : `${BASE_URL}${product.image}`} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <span style={{ fontSize: "11px", color: "#999" }}>No Image</span>
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px", lineHeight: "1.3" }}>{product.name}</h4>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Category: {product.category?.name || "Gadgets"}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--primary)" }}>৳{unitPrice}</span>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>x {qty}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity control */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "13px", color: "#555" }}>Qty:</span>
                    <div className="izu-chk-qty-control">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="izu-chk-qty-btn" style={{ border: "none", background: "#f5f5f5", padding: "4px 10px", cursor: "pointer" }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      </button>
                      <span className="izu-chk-qty-val" style={{ width: "32px", textAlign: "center", fontSize: "13px", fontWeight: 700 }}>{qty}</span>
                      <button onClick={() => setQty(qty + 1)} className="izu-chk-qty-btn" style={{ border: "none", background: "#f5f5f5", padding: "4px 10px", cursor: "pointer" }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Subtotal ({qty} items)</span>
                      <strong style={{ color: "var(--text-primary)" }}>৳{subtotal}</strong>
                    </div>
                    {couponApplied && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#389e0d" }}>
                        <span>Coupon Discount ({couponCode.toUpperCase()})</span>
                        <strong>-৳{discountAmount}</strong>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Delivery Fee</span>
                      <strong style={{ color: "var(--text-primary)" }}>
                        {couponCode.trim().toUpperCase() === "FREESHIP" ? (
                          <><span style={{ textDecoration: "line-through", color: "var(--text-muted)", marginRight: "6px" }}>৳{deliveryCharge}</span> ৳0 (Free)</>
                        ) : `৳${deliveryCharge}`}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "800", color: "var(--text-primary)", borderTop: "2px solid var(--border-light)", paddingTop: "14px", marginTop: "4px" }}>
                      <span>Grand Total</span>
                      <span style={{ color: "var(--primary)" }}>৳{grandTotal}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: "24px", padding: "12px", background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: "8px", fontSize: "11px", color: "#389e0d", display: "flex", gap: "6px" }}>
                    <span>🛡️</span>
                    <span><strong>100% Secure Checkout:</strong> Your information is fully encrypted and protected. Payment on Delivery is supported.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

import { use } from "react";

export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <>
      <Header />
      <Suspense fallback={
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <h2>Preparing Secure Checkout...</h2>
        </div>
      }>
        <CheckoutContent slug={slug} />
      </Suspense>
      <Footer />
    </>
  );
}
