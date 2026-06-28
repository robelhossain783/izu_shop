"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth-context";
import Header from "../_components/Header";
import Footer from "../_components/Footer";
import "../izu_shop.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] || "U").toUpperCase();
}

function useMedia(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function Svg({ d, size = 18 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#fffbeb", text: "#b45309" },
    processing: { bg: "#eff6ff", text: "#1d4ed8" },
    completed: { bg: "#ecfdf5", text: "#047857" },
    cancelled: { bg: "#fef2f2", text: "#dc2626" },
  };
  const c = colors[status.toLowerCase()] || { bg: "#f5f5f5", text: "#666" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
      color: c.text, background: c.bg, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.text }} />
      {status}
    </span>
  );
}

function formatDate(dateStr: string) {
  try { return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); } catch { return dateStr; }
}

const theme = {
  primary: "#e8320a", orange: "#f05a28",
  dark: "#111", muted: "#94a3b8",
  border: "#e8e8e8", text: "#475569", white: "#fff", bg: "#f8fafc",
};

const inputStyle = {
  width: "100%", padding: "12px 16px", border: `1.5px solid ${theme.border}`, borderRadius: 10,
  fontSize: 15, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const,
  transition: "border-color 0.2s, box-shadow 0.2s",
  background: theme.white,
};

function ProfileContent() {
  const isMobile = useMedia("(max-width: 767px)");
  const router = useRouter();
  const { user, isLoading, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "orders">("info");
  const [editing, setEditing] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  useEffect(() => {
    if (!user || activeTab !== "orders") return;
    setOrdersLoading(true);
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/orders/customer/?user_id=${user.id}`, {
          headers: { "Content-Type": "application/json" }, cache: "no-store",
        });
        let list: any[] = [];
        if (res.ok) { const data = await res.json(); list = data.data || []; }
        if (list.length === 0 && user.phone) {
          const listRes = await fetch(`${BASE_URL}/api/orders/list/`, { headers: { "Content-Type": "application/json" }, cache: "no-store" });
          if (listRes.ok) {
            const data = await listRes.json();
            const all: any[] = data.data || [];
            const digits = user.phone.replace(/\D/g, "");
            list = all.filter((o: any) => { const od = o.phone ? o.phone.replace(/\D/g, "") : ""; return od.length >= 10 && digits.length >= 10 && od.slice(-10) === digits.slice(-10); });
          }
        }
        setOrders(list);
      } catch {}
      setOrdersLoading(false);
    })();
  }, [user, activeTab]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setMsg("");
    try {
      const res = await fetch(`${BASE_URL}/api/auth/profile/${user.id}/`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, phone, address }),
      });
      if (res.ok) {
        const data = await res.json();
        updateUser({ first_name: data.first_name, last_name: data.last_name, email: data.email, phone: data.phone, address: data.address });
        setMsg("Profile updated successfully!"); setMsgType("success"); setEditing(false);
      } else {
        const data = await res.json();
        setMsg(data.error || "Update failed"); setMsgType("error");
      }
    } catch { setMsg("Network error"); setMsgType("error"); }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  }

  if (isLoading) {
    return <><Header /><div style={{ textAlign: "center", padding: "100px 24px", fontSize: 15, color: theme.muted }}>Loading...</div><Footer /></>;
  }

  if (!user) {
    return (
      <><Header />
        <div style={{ background: theme.bg, minHeight: "calc(100vh - 120px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", padding: "40px 24px" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fef2f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.dark, margin: "0 0 8px" }}>Login Required</h2>
            <p style={{ color: theme.text, fontSize: 14, lineHeight: 1.6, maxWidth: 340, margin: "0 auto 28px" }}>Sign in to manage your profile, track orders, and more.</p>
            <a href="/auth" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.orange})`, color: theme.white,
              padding: "13px 36px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 15,
              boxShadow: "0 4px 14px rgba(232,50,10,0.3)",
            }}>Sign In</a>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
  const initials = getInitials(displayName);

  const infoFields = [
    { label: "First Name", value: user.first_name || "—", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" },
    { label: "Last Name", value: user.last_name || "—", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" },
    { label: "Email", value: user.email || "—", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" },
    { label: "Phone", value: user.phone || "—", icon: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" },
  ];

  return (
    <>
      <Header />
      <div style={{ background: theme.bg, minHeight: "calc(100vh - 120px)" }}>
        <div style={{
          maxWidth: isMobile ? "100%" : 1320,
          margin: "0 auto",
          padding: isMobile ? "0 0 40px" : "28px 20px 60px",
        }}>
          {/* PROFILE HEADER */}
          <div style={{
            background: theme.white,
            borderRadius: isMobile ? 0 : 16,
            borderBottom: isMobile ? `1px solid ${theme.border}` : "none",
            boxShadow: isMobile ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
            padding: isMobile ? "20px 20px 16px" : "24px 28px",
            marginBottom: isMobile ? 8 : 24,
            display: "flex", alignItems: "center", gap: isMobile ? 14 : 20,
          }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: isMobile ? 56 : 64, height: isMobile ? 56 : 64, borderRadius: "50%",
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.orange})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isMobile ? 22 : 24, fontWeight: 800, color: theme.white,
                boxShadow: `0 4px 14px rgba(232,50,10,0.3)`,
              }}>{initials}</div>
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: isMobile ? 14 : 18, height: isMobile ? 14 : 18, borderRadius: "50%",
                background: "#10b981", border: `3px solid ${theme.white}`,
                boxShadow: "0 0 0 1px rgba(0,0,0,0.05)",
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? 17 : 20, fontWeight: 800, color: theme.dark,
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              }}>
                {displayName}
                <span style={{
                  background: "rgba(232,50,10,0.08)", color: theme.primary,
                  fontSize: 11, fontWeight: 700, padding: "3px 14px", borderRadius: 20,
                }}>Customer</span>
              </div>
              <div style={{
                fontSize: isMobile ? 13 : 14, color: theme.muted, marginTop: 2,
                display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
              }}>
                <span>@{user.username}</span>
                {!isMobile && <><span style={{ color: theme.border }}>|</span><span>{user.email || ""}</span></>}
              </div>
            </div>
            {!isMobile && (
              <button onClick={() => setConfirmLogout(true)} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#fef2f2", color: "#dc2626", border: "none",
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "all 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fef2f2"; }}>
                <Svg d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" size={15} />
                Sign Out
              </button>
            )}
          </div>

          {/* TAB BAR */}
          <div style={{
            display: "flex", gap: isMobile ? 0 : 8,
            borderBottom: isMobile ? `1px solid ${theme.border}` : "none",
            background: isMobile ? theme.white : "none",
            marginBottom: isMobile ? 0 : 24,
            padding: isMobile ? 0 : "0 4px",
          }}>
            {(["info", "orders"] as const).map((tab) => {
              const active = activeTab === tab;
              return (
                <button key={tab}
                  onClick={() => { setActiveTab(tab); setMsg(""); }}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    padding: isMobile ? "14px 8px" : "11px 24px",
                    border: isMobile ? "none" : "none",
                    background: isMobile ? "none" : (active ? theme.white : "transparent"),
                    color: active ? theme.primary : theme.text,
                    fontSize: isMobile ? 14 : 14,
                    fontWeight: active ? 800 : 600,
                    cursor: "pointer",
                    borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent",
                    borderRadius: isMobile ? 0 : 10,
                    boxShadow: !isMobile && active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                    display: "flex", alignItems: "center", gap: 8,
                    whiteSpace: "nowrap", transition: "all 0.15s",
                    position: "relative",
                  }}>
                  <Svg d={tab === "info" ? "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 7a4 4 0 100-8 4 4 0 000 8z" : "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18 M16 10a4 4 0 01-8 0"} size={16} />
                  {tab === "info" ? "Personal Info" : "Order History"}
                </button>
              );
            })}
          </div>

          {/* CONTENT */}
          <div style={{
            background: theme.white,
            border: isMobile ? "none" : `1px solid ${theme.border}`,
            borderRadius: isMobile ? 0 : 16,
            overflow: "hidden",
            boxShadow: isMobile ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            {activeTab === "info" ? (
              <>
                <div style={{
                  padding: isMobile ? "20px 20px 16px" : "24px 28px 20px",
                  borderBottom: `1px solid ${theme.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                }}>
                  <div>
                    <h2 style={{ fontSize: isMobile ? 17 : 18, fontWeight: 800, color: theme.dark, margin: "0 0 2px" }}>Personal Information</h2>
                    <p style={{ fontSize: 13, color: theme.muted, margin: 0 }}>
                      {editing ? "Update your details below." : "Manage your account details."}
                    </p>
                  </div>
                  {!editing && (
                    <button onClick={() => setEditing(true)} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.orange})`, color: theme.white, border: "none",
                      padding: isMobile ? "9px 18px" : "10px 22px", borderRadius: 10,
                      fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                      boxShadow: "0 3px 10px rgba(232,50,10,0.2)",
                    }}>
                      <Svg d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" size={15} />
                      {isMobile ? "Edit" : "Edit Profile"}
                    </button>
                  )}
                </div>

                {msg && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    margin: "16px 28px 0", padding: "12px 18px", borderRadius: 10,
                    fontSize: 14, fontWeight: 600,
                    background: msgType === "success" ? "#ecfdf5" : "#fef2f2",
                    color: msgType === "success" ? "#047857" : "#dc2626",
                  }}>
                    <Svg d={msgType === "success" ? "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01 9 11.01" : "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01"} size={18} />
                    {msg}
                  </div>
                )}

                <div style={{ padding: isMobile ? 16 : 28 }}>
                  {!editing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      {isMobile ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: theme.border, borderRadius: 12, overflow: "hidden" }}>
                          {infoFields.map((f, i) => (
                            <div key={f.label} style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "14px 16px", background: theme.white,
                              borderBottomLeftRadius: i === 3 ? 12 : 0,
                              borderBottomRightRadius: i === 3 ? 12 : 0,
                            }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              }}>
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{f.label}</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: theme.dark, marginTop: 1, wordBreak: "break-word" }}>{f.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                          {infoFields.map((f) => (
                            <div key={f.label} style={{
                              display: "flex", alignItems: "flex-start", gap: 12,
                              padding: 16, background: "#f8fafc", borderRadius: 12,
                            }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: theme.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                              }}>
                                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: theme.dark, marginTop: 3 }}>{f.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div>
                        <div style={{
                          display: "block", fontSize: 12, fontWeight: 700,
                          color: theme.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
                        }}>Shipping Address</div>
                        {isMobile ? (
                          <div style={{
                            background: theme.white, border: `1px solid ${theme.border}`, borderRadius: 12,
                            padding: "14px 16px",
                          }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: theme.text, lineHeight: 1.6 }}>{user.address || "—"}</div>
                          </div>
                        ) : (
                          <div style={{
                            padding: 16, background: "#f8fafc", borderRadius: 12,
                            fontSize: 15, fontWeight: 500, color: theme.text, lineHeight: 1.6,
                          }}>{user.address || "—"}</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <form style={{ display: "flex", flexDirection: "column", gap: 20 }} onSubmit={handleSave}>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 6 }}>First Name</label>
                          <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name"
                            onFocus={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,50,10,0.1)"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = "none"; }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 6 }}>Last Name</label>
                          <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name"
                            onFocus={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,50,10,0.1)"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = "none"; }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 6 }}>Email</label>
                        <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"
                          onFocus={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,50,10,0.1)"; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = "none"; }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 6 }}>Phone</label>
                        <input style={inputStyle} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801700000000"
                          onFocus={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,50,10,0.1)"; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = "none"; }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 6 }}>Shipping Address</label>
                        <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Full delivery address..."
                          onFocus={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,50,10,0.1)"; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = "none"; }} />
                      </div>
                      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
                        <button type="button" onClick={() => {
                          setFirstName(user.first_name || ""); setLastName(user.last_name || "");
                          setEmail(user.email || ""); setPhone(user.phone || "");
                          setAddress(user.address || ""); setEditing(false); setMsg("");
                        }} style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                          background: theme.white, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: 10,
                          fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "12px 28px",
                        }}>Cancel</button>
                        <button type="submit" disabled={saving} style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                          background: saving ? "#94a3b8" : `linear-gradient(135deg, ${theme.primary}, ${theme.orange})`,
                          color: theme.white, border: "none", borderRadius: 10,
                          fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                          padding: "12px 32px",
                          boxShadow: !saving ? "0 3px 10px rgba(232,50,10,0.2)" : "none",
                        }}>
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{
                  padding: isMobile ? "20px 20px 16px" : "24px 28px 20px",
                  borderBottom: `1px solid ${theme.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                }}>
                  <div>
                    <h2 style={{ fontSize: isMobile ? 17 : 18, fontWeight: 800, color: theme.dark, margin: "0 0 2px" }}>Order History</h2>
                    <p style={{ fontSize: 13, color: theme.muted, margin: 0 }}>Track your previous purchases.</p>
                  </div>
                  {orders.length > 0 && (
                    <span style={{
                      background: "#f1f5f9", color: theme.text,
                      fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 20,
                    }}>{orders.length} order{orders.length > 1 ? "s" : ""}</span>
                  )}
                </div>
                <div style={{ padding: isMobile ? 16 : 28 }}>
                  {ordersLoading ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: theme.muted, fontSize: 14 }}>
                      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }}>
                        <circle cx="12" cy="12" r="10" strokeDasharray="30 70" />
                      </svg>
                      Loading orders...
                    </div>
                  ) : orders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18 M16 10a4 4 0 01-8 0" /></svg>
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: theme.dark, margin: "0 0 6px" }}>No Orders Yet</h3>
                      <p style={{ fontSize: 14, color: theme.muted, margin: "0 0 24px" }}>Start exploring our products.</p>
                      <a href="/" style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.orange})`, color: theme.white,
                        padding: "12px 32px", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14,
                        boxShadow: "0 3px 10px rgba(232,50,10,0.2)",
                      }}>
                        Browse Products
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                      </a>
                    </div>
                  ) : isMobile ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {orders.map((order: any) => {
                        const oid = order.order_id || `#${order.id}`;
                        const isExpanded = expandedOrder === oid;
                        const amt = Number(order.total_amount || order.amount || 0);
                        return (
                          <div key={oid} style={{ background: theme.white, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden" }}>
                            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                              onClick={() => setExpandedOrder(isExpanded ? null : oid)}>
                              <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              }}>
                                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: theme.dark }}>{oid}</div>
                                <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{formatDate(order.created_at)}</div>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: theme.primary }}>৳{amt.toLocaleString("en-BD")}</div>
                                <StatusBadge status={order.status} />
                              </div>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                            {isExpanded && (
                              <div style={{ borderTop: `1px solid ${theme.border}`, background: "#fafafa" }}>
                                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                                  {[
                                    { label: "Name", value: order.full_name || "—" },
                                    { label: "Phone", value: order.phone || "—" },
                                    { label: "Payment", value: order.payment_type || order.paymentMethod || "COD" },
                                    { label: "Total", value: `৳${amt.toFixed(2)}` },
                                  ].map((d) => (
                                    <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <span style={{ fontSize: 13, color: theme.muted }}>{d.label}</span>
                                      <span style={{ fontSize: 14, fontWeight: 600, color: theme.dark }}>{d.value}</span>
                                    </div>
                                  ))}
                                </div>
                                {order.address && (
                                  <div style={{ borderTop: `1px solid ${theme.border}`, padding: "12px 16px" }}>
                                    <div style={{ fontSize: 13, color: theme.muted, marginBottom: 4 }}>Address</div>
                                    <div style={{ fontSize: 14, color: theme.text, lineHeight: 1.5 }}>{order.address}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
                            {["Order ID", "Date", "Total", "Payment", "Status"].map((h) => (
                              <th key={h} style={{ textAlign: "left", padding: "14px 16px", fontWeight: 700, color: theme.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order: any, idx: number) => (
                            <tr key={order.order_id || order.id} style={{
                              borderBottom: `1px solid ${theme.border}`,
                              background: idx % 2 === 0 ? theme.white : "#fafafa",
                            }}>
                              <td style={{ padding: "16px", fontWeight: 700, color: theme.dark, fontSize: 14 }}>{order.order_id || `#${order.id}`}</td>
                              <td style={{ padding: "16px", color: theme.muted, fontSize: 14, whiteSpace: "nowrap" }}>{formatDate(order.created_at)}</td>
                              <td style={{ padding: "16px", fontWeight: 700, color: theme.primary, fontSize: 16 }}>৳{Number(order.total_amount || order.amount || 0).toLocaleString("en-BD")}</td>
                              <td style={{ padding: "16px", color: theme.text, fontSize: 14 }}>{order.payment_type || order.paymentMethod || "COD"}</td>
                              <td style={{ padding: "16px" }}><StatusBadge status={order.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* MOBILE: Sign out row */}
            {isMobile && (
              <div style={{ borderTop: `8px solid ${theme.bg}`, padding: "16px 20px 8px" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <a href="/orders" style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: theme.white, border: `1.5px solid ${theme.border}`,
                    padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", textDecoration: "none", color: theme.text,
                  }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    All Orders
                  </a>
                  <button onClick={() => setConfirmLogout(true)} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: "#fef2f2", border: "none",
                    padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#dc2626",
                  }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" /></svg>
                    Sign Out
                  </button>
                </div>
                <div style={{ textAlign: "center", fontSize: 11, color: theme.muted, paddingTop: 8 }}>
                  IzuShop &middot; Customer Account
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {confirmLogout && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.5)", padding: 20,
        }} onClick={() => setConfirmLogout(false)}>
          <div style={{
            background: theme.white, borderRadius: 20, padding: "32px",
            maxWidth: 360, width: "100%", textAlign: "center",
            boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" /></svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: theme.dark, margin: "0 0 6px" }}>Sign Out</h3>
            <p style={{ fontSize: 14, color: theme.text, margin: "0 0 28px", lineHeight: 1.5 }}>Are you sure you want to sign out of your account?</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setConfirmLogout(false)} style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: theme.white, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: 12,
                fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "12px 28px", flex: 1,
              }}>Cancel</button>
              <button onClick={() => { logout(); setConfirmLogout(false); router.push("/"); }} style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "#dc2626", color: theme.white, border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "12px 28px", flex: 1,
                boxShadow: "0 3px 10px rgba(220,38,38,0.3)",
              }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default function ProfilePage() {
  return <ProfileContent />;
}
