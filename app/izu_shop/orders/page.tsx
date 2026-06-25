"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../auth-context";
import Header from "../_components/Header";
import Footer from "../_components/Footer";
import "../izu_shop.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

interface OrderItem {
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
}

interface Order {
  order_id: string;
  fullName: string;
  phone: string;
  address: string;
  paymentMethod: string;
  amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: "#b45309", bg: "#fffbeb", label: "Pending" },
  processing: { color: "#1d4ed8", bg: "#eff6ff", label: "Processing" },
  completed: { color: "#047857", bg: "#ecfdf5", label: "Completed" },
  cancelled: { color: "#dc2626", bg: "#fef2f2", label: "Cancelled" },
};

function getStatusCfg(status: string) {
  return statusConfig[status.toLowerCase()] || { color: "#666", bg: "#f5f5f5", label: status };
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch { return dateStr; }
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function OrdersContent() {
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isLoading) return;
    if (!user) { setLoading(false); return; }
    const currentUser = user;

    async function fetchOrders() {
      try {
        const res = await fetch(`${BASE_URL}/api/orders/customer/?user_id=${currentUser.id}`, {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        let list: any[] = [];
        if (res.ok) {
          const data = await res.json();
          list = data.data || [];
        }
        if (list.length === 0 && currentUser.phone) {
          const listRes = await fetch(`${BASE_URL}/api/orders/list/`, {
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          });
          if (listRes.ok) {
            const data = await listRes.json();
            const all: any[] = data.data || [];
            const digits = currentUser.phone.replace(/\D/g, "");
            list = all.filter((o: any) => {
              const od = o.phone ? o.phone.replace(/\D/g, "") : "";
              return od.length >= 10 && digits.length >= 10 && od.slice(-10) === digits.slice(-10);
            });
          }
        }
        setOrders(list.map((o: any) => ({
          order_id: o.order_id || `#${o.id}`,
          fullName: o.full_name || "",
          phone: o.phone || "",
          address: o.address || "",
          paymentMethod: o.payment_type || "COD",
          amount: Number(o.total_amount || o.amount || 0),
          status: o.status || "pending",
          created_at: o.created_at || "",
          items: (o.items || []).map((i: any) => ({
            product_name: i.product?.name || "Product",
            product_image: i.product?.image || null,
            quantity: i.quantity || 1,
            price: Number(i.price || 0),
          })),
        })));
      } catch {}
      setLoading(false);
    }
    fetchOrders();
  }, [user, isLoading]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (isLoading || loading) {
    return <><Header /><div style={{ textAlign: "center", padding: "100px 24px", color: "#999", fontSize: 14 }}>Loading orders...</div><Footer /></>;
  }

  if (!user) {
    return (
      <><Header />
        <div style={{ textAlign: "center", padding: "100px 24px" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fef2f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#e8320a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>Login Required</h2>
          <p style={{ color: "#666", marginBottom: 28, fontSize: 14, maxWidth: 320, margin: "0 auto 28px", lineHeight: 1.6 }}>Please sign in to view your order history and track shipments.</p>
          <a href="/izu_shop/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#e8320a", color: "#fff", padding: "12px 32px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>Sign In</a>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div style={{ background: "#f8f8f8", minHeight: "calc(100vh - 120px)" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 20px 60px" }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", margin: "0 0 4px" }}>My Orders</h1>
            <p style={{ fontSize: 14, color: "#666", margin: 0 }}>Track and manage your orders.</p>
          </div>

          {orders.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Total Orders", value: orders.length, color: "#1a1a1a", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" },
                { label: "Completed", value: orders.filter((o) => o.status === "completed").length, color: "#10b981", icon: "M9 12l2 2 4-4 M22 12a10 10 0 11-5.93-9.14" },
                { label: "Pending", value: orders.filter((o) => o.status === "pending" || o.status === "processing").length, color: "#f59e0b", icon: "M12 8v4l3 3 M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" },
              ].map((stat) => (
                <div key={stat.label} style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", padding: "20px", textAlign: "center" }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px", display: "block" }}><path d={stat.icon} /></svg>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.2 }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 24px", background: "#fff", border: "1px solid #f0f0f0", borderRadius: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18 M16 10a4 4 0 01-8 0" /></svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", margin: "0 0 6px" }}>No Orders Yet</h3>
              <p style={{ color: "#666", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>You haven&apos;t placed any orders. Start exploring our products!</p>
              <a href="/izu_shop" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#e8320a", color: "#fff", padding: "12px 32px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                Browse Products
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {orders.map((order) => {
                const cfg = getStatusCfg(order.status);
                const isOpen = expanded.has(order.order_id);
                return (
                  <div key={order.order_id} style={{
                    background: "#fff", border: "1px solid #f0f0f0", borderRadius: 14,
                    overflow: "hidden", transition: "box-shadow 0.2s",
                  }}>
                    <div style={{
                      padding: "20px 24px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 20,
                    }} onClick={() => toggle(order.order_id)}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{order.order_id}</span>
                          <span style={{
                            display: "inline-block", fontSize: 12, fontWeight: 700,
                            padding: "4px 12px", borderRadius: 8,
                            color: cfg.color, background: cfg.bg,
                          }}>{cfg.label}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
                          {formatDate(order.created_at)} at {formatTime(order.created_at)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 19, fontWeight: 800, color: "#e8320a" }}>৳{order.amount.toFixed(2)}</div>
                        <div style={{ fontSize: 12, color: "#999", marginTop: 1 }}>{order.items.length} item{order.items.length > 1 ? "s" : ""}</div>
                      </div>
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {isOpen && (
                      <div style={{ borderTop: "1px solid #f5f5f5" }}>
                        <div style={{ padding: "20px 24px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Items</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {order.items.map((item, idx) => (
                              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 10, background: "#f5f5f5", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {item.product_image ? (
                                    <img src={item.product_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  ) : (
                                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18 M16 10a4 4 0 01-8 0" /></svg>
                                  )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.product_name}</div>
                                </div>
                                <div style={{ fontSize: 13, color: "#999", whiteSpace: "nowrap" }}>x{item.quantity}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", minWidth: 80, textAlign: "right" }}>৳{(item.price * item.quantity).toFixed(2)}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ borderTop: "1px solid #f5f5f5", padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {[
                            { label: "Name", value: order.fullName },
                            { label: "Phone", value: order.phone },
                            { label: "Payment", value: order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod },
                            { label: "Total", value: `৳${order.amount.toFixed(2)}`, highlight: true },
                          ].map((d) => (
                            <div key={d.label}>
                              <div style={{ fontSize: 12, color: "#999", fontWeight: 600, marginBottom: 3 }}>{d.label}</div>
                              <div style={{ fontSize: 14, fontWeight: d.highlight ? 800 : 600, color: d.highlight ? "#e8320a" : "#1a1a1a" }}>{d.value}</div>
                            </div>
                          ))}
                        </div>

                        {order.address && (
                          <div style={{ borderTop: "1px solid #f5f5f5", padding: "20px 24px" }}>
                            <div style={{ fontSize: 12, color: "#999", fontWeight: 600, marginBottom: 4 }}>Delivery Address</div>
                            <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>{order.address}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function OrdersPage() {
  return <OrdersContent />;
}
