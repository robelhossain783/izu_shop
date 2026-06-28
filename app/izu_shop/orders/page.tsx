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
    return <><Header /><div className="orders-loading">Loading orders...</div><Footer /></>;
  }

  if (!user) {
    return (
      <><Header />
        <div className="orders-login">
          <div className="orders-login-icon">
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#e8320a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </div>
          <h2>Login Required</h2>
          <p>Please sign in to view your order history and track shipments.</p>
          <a href="/auth" className="orders-btn">Sign In</a>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="orders-page">
        <div className="orders-container">
          <div className="orders-header">
            <h1>My Orders</h1>
            <p>Track and manage your orders.</p>
          </div>

          {orders.length > 0 && (
            <div className="orders-stats">
              {[
                { label: "Total Orders", value: orders.length, color: "#1a1a1a", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" },
                { label: "Completed", value: orders.filter((o) => o.status === "completed").length, color: "#10b981", icon: "M9 12l2 2 4-4 M22 12a10 10 0 11-5.93-9.14" },
                { label: "Pending", value: orders.filter((o) => o.status === "pending" || o.status === "processing").length, color: "#f59e0b", icon: "M12 8v4l3 3 M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" },
              ].map((stat) => (
                <div key={stat.label} className="orders-stat-card">
                  <svg className="orders-stat-icon" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={stat.icon} /></svg>
                  <div className="orders-stat-value">{stat.value}</div>
                  <div className="orders-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="orders-empty">
              <div className="orders-empty-icon">
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18 M16 10a4 4 0 01-8 0" /></svg>
              </div>
              <h3>No Orders Yet</h3>
              <p>You haven&apos;t placed any orders. Start exploring our products!</p>
              <a href="/" className="orders-btn">
                Browse Products
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </a>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const cfg = getStatusCfg(order.status);
                const isOpen = expanded.has(order.order_id);
                return (
                  <div key={order.order_id} className="orders-card">
                    <div className="orders-card-header" onClick={() => toggle(order.order_id)}>
                      <div className="orders-card-icon" style={{ background: cfg.bg }}>
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                      </div>
                      <div className="orders-card-info">
                        <div className="orders-card-top">
                          <span className="orders-card-id">{order.order_id}</span>
                          <span className="orders-card-badge" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                        </div>
                        <div className="orders-card-date">{formatDate(order.created_at)} at {formatTime(order.created_at)}</div>
                      </div>
                      <div className="orders-card-amount">
                        <div className="orders-card-price">৳{order.amount.toFixed(2)}</div>
                        <div className="orders-card-count">{order.items.length} item{order.items.length > 1 ? "s" : ""}</div>
                      </div>
                      <svg className={`orders-card-arrow ${isOpen ? "open" : ""}`} width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {isOpen && (
                      <div className="orders-card-body">
                        <div className="orders-items">
                          <div className="orders-items-title">Items</div>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="orders-item">
                              <div className="orders-item-img">
                                {item.product_image ? (
                                  <img src={item.product_image} alt="" />
                                ) : (
                                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18 M16 10a4 4 0 01-8 0" /></svg>
                                )}
                              </div>
                              <div className="orders-item-name">{item.product_name}</div>
                              <div className="orders-item-qty">x{item.quantity}</div>
                              <div className="orders-item-price">৳{(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>

                        <div className="orders-details">
                          {[
                            { label: "Name", value: order.fullName },
                            { label: "Phone", value: order.phone },
                            { label: "Payment", value: order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod },
                            { label: "Total", value: `৳${order.amount.toFixed(2)}`, highlight: true },
                          ].map((d) => (
                            <div key={d.label}>
                              <div className="orders-detail-label">{d.label}</div>
                              <div className={`orders-detail-value${d.highlight ? " highlight" : ""}`}>{d.value}</div>
                            </div>
                          ))}
                        </div>

                        {order.address && (
                          <div className="orders-address">
                            <div className="orders-address-label">Delivery Address</div>
                            <div className="orders-address-text">{order.address}</div>
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
