"use client";

import { useState } from "react";
import { useCart } from "../cart-context";
import Header from "../_components/Header";
import Footer from "../_components/Footer";
import "../izu_shop.css";

function formatPrice(price: number) { return `৳${price.toLocaleString("en-BD")}`; }

function MinusIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function PlusIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function TrashIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
}
function ChevronLeftIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>;
}

function CartContent() {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderError, setOrderError] = useState("");

  function handlePlaceOrder() {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setOrderError("Please fill in all required fields");
      setTimeout(() => setOrderError(""), 4000);
      return;
    }
    setPlacing(true);
    setOrderError("");
    const orderData = {
      items: cart.map((i) => ({ id: i.product.id, name: i.product.name, quantity: i.quantity, price: i.product.sell_price })),
      customer: form, total: cartTotal,
    };
    try {
      const saved = JSON.parse(localStorage.getItem("izu_shop_orders") || "[]");
      saved.push({ ...orderData, date: new Date().toISOString() });
      localStorage.setItem("izu_shop_orders", JSON.stringify(saved));
    } catch {}
    setTimeout(() => { setPlacing(false); setPlaced(true); clearCart(); }, 800);
  }

  if (placed) {
    return (
      <><Header />
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", marginBottom: 12 }}>Order Placed!</h2>
          <p style={{ fontSize: 14, color: "#555", marginBottom: 28 }}>Thank you for your order. We will contact you soon.</p>
          <a href="/" style={{ display: "inline-block", background: "#e8320a", color: "#fff", padding: "14px 36px", borderRadius: 12, textDecoration: "none", fontWeight: 700 }}>Continue Shopping</a>
        </div>
        <Footer /></>
    );
  }

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px 48px" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#999", textDecoration: "none", marginBottom: 20 }}>
          <ChevronLeftIcon size={14} /> Back to Shop
        </a>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", marginBottom: 24 }}>Shopping Cart ({cartCount} items)</h1>

        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>Your cart is empty</h3>
            <a href="/" style={{ display: "inline-block", background: "#e8320a", color: "#fff", padding: "12px 32px", borderRadius: 12, textDecoration: "none", fontWeight: 700 }}>Start Shopping</a>
          </div>
        ) : (
          <div className="izu-cart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>
            <div>
              {cart.map((item) => (
                <div key={item.product.id} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 10, overflow: "hidden", background: "#f5f5f5", flexShrink: 0 }}>
                    {item.product.image ? <img src={item.product.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 28 }}>📦</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <a href={`/product/${item.product.slug}`} style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", textDecoration: "none", display: "block", marginBottom: 4 }}>{item.product.name}</a>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#e8320a", marginBottom: 8 }}>{formatPrice(parseFloat(item.product.sell_price) * item.quantity)}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid #e8e8e8", borderRadius: 6, overflow: "hidden" }}>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} style={{ border: "none", background: "#f5f5f5", padding: "4px 10px", cursor: "pointer" }}><MinusIcon size={14} /></button>
                        <span style={{ width: 36, textAlign: "center", fontSize: 13, fontWeight: 700 }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} style={{ border: "none", background: "#f5f5f5", padding: "4px 10px", cursor: "pointer" }}><PlusIcon size={14} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer", padding: 4 }}><TrashIcon size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="izu-cart-summary" style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 16, padding: 24, position: "sticky", top: 80 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", marginBottom: 20 }}>Order Summary</h3>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#555", marginBottom: 8 }}>
                <span>Subtotal ({cartCount} items)</span><span style={{ fontWeight: 700, color: "#1a1a1a" }}>{formatPrice(cartTotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#555", marginBottom: 8 }}>
                <span>Shipping</span><span style={{ color: "#059669", fontWeight: 600 }}>Free</span>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "16px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "#1a1a1a", marginBottom: 24 }}>
                <span>Total</span><span style={{ color: "#e8320a" }}>{formatPrice(cartTotal)}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} />
                <input placeholder="Phone Number *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} />
                <textarea placeholder="Delivery Address *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} style={{ ...inp, resize: "vertical" }} />
                <textarea placeholder="Order Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} />
              </div>

              {orderError && <div style={{ color: "#dc2626", fontSize: 12, fontWeight: 600, marginTop: 8 }}>{orderError}</div>}

              <button onClick={handlePlaceOrder} disabled={placing}
                style={{ marginTop: 16, width: "100%", background: placing ? "#ccc" : "linear-gradient(135deg, #e8320a, #f05a28)", color: "#fff", border: "none", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: placing ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(232,50,10,0.25)" }}>
                {placing ? "Placing Order..." : "Place Order"}
              </button>
              <p style={{ fontSize: 11, color: "#999", textAlign: "center", marginTop: 12 }}>Cash on Delivery available</p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

const inp: React.CSSProperties = {
  padding: "10px 14px", border: "1px solid #e8e8e8", borderRadius: 8,
  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
};

export default function CartPage() {
  return <CartContent />;
}
