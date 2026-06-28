export default function Footer() {
  return (
    <footer style={{
      marginTop: "auto",
      background: "#111",
      color: "#ccc",
      padding: "40px 16px 20px",
      fontSize: 14,
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 32, marginBottom: 32 }}
          className="izu-footer-grid">
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 12 }}>
              Izu<span style={{ color: "#e8320a" }}>Shop</span>
            </div>
            <p style={{ lineHeight: 1.7, color: "#999" }}>
              Bangladesh&apos;s trusted e-commerce store for premium products.<br />
              Authentic products, fast delivery.
            </p>
          </div>
          <div>
            <h4 style={{ color: "#fff", marginBottom: 12, fontSize: 14 }}>Quick Links</h4>
            <ul style={{ listStyle: "none", padding: 0, lineHeight: 2.2 }}>
              <li><a href="/" style={{ color: "#999", textDecoration: "none" }}>Home</a></li>
              <li><a href="/cart" style={{ color: "#999", textDecoration: "none" }}>Cart</a></li>
              <li><a href="/orders" style={{ color: "#999", textDecoration: "none" }}>Orders</a></li>
              <li><a href="/auth" style={{ color: "#999", textDecoration: "none" }}>Login</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: "#fff", marginBottom: 12, fontSize: 14 }}>Contact</h4>
            <p style={{ color: "#999", lineHeight: 2 }}>buyfestbd@gmail.com</p>
            <p style={{ color: "#999", lineHeight: 2 }}>01635275630</p>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #333", paddingTop: 20, textAlign: "center", color: "#666", fontSize: 13 }}>
          &copy; 2026 IzuShop | All rights reserved
        </div>
      </div>
    </footer>
  );
}
