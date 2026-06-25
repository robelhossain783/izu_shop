"use client";

import { usePathname } from "next/navigation";
import { useCart } from "../cart-context";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

function TrashIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default function CartSidebar() {
  const { cart, removeFromCart, updateQuantity, closeCart, isCartOpen, cartCount, cartTotal } = useCart();
  const pathname = usePathname();
  if (pathname?.startsWith("/izu_shop/auth")) return null;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const first = cart[0];
    window.location.href = `/izu_shop/checkout/${first.product.slug}?qty=${first.quantity}`;
  };

  return (
    <>
      <div className={`izu-cart-overlay ${isCartOpen ? "open" : ""}`} onClick={closeCart} />
      <div className={`izu-cart-drawer ${isCartOpen ? "open" : ""}`}>
        <div className="izu-cart-drawer-header">
          <h3>Shopping Cart ({cartCount})</h3>
          <button className="izu-cart-drawer-close" onClick={closeCart} aria-label="Close cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="izu-cart-drawer-body">
          {cart.length === 0 ? (
            <div className="izu-cart-drawer-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <p>Your cart is empty</p>
            </div>
          ) : (
            <ul className="izu-cart-drawer-items">
              {cart.map((item) => {
                const imgSrc = item.product.image?.startsWith("http")
                  ? item.product.image
                  : item.product.image ? `${BASE_URL}${item.product.image}` : null;
                return (
                  <li key={item.product.id} className="izu-cart-drawer-item">
                    <div className="izu-cart-drawer-item-img">
                      {imgSrc ? (
                        <img src={imgSrc} alt={item.product.name} />
                      ) : (
                        <span style={{ fontSize: 24 }}>📦</span>
                      )}
                    </div>
                    <div className="izu-cart-drawer-item-info">
                      <a
                        href={`/izu_shop/product/${item.product.slug}`}
                        className="izu-cart-drawer-item-name"
                        onClick={closeCart}
                      >
                        {item.product.name}
                      </a>
                      <div className="izu-cart-drawer-item-price">
                        ৳{parseFloat(item.product.sell_price).toLocaleString("en-BD")}
                      </div>
                      <div className="izu-cart-drawer-item-qty">
                        <button
                          className="izu-cart-drawer-qty-btn"
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeFromCart(item.product.id);
                            } else {
                              updateQuantity(item.product.id, item.quantity - 1);
                            }
                          }}
                        >
                          −
                        </button>
                        <span className="izu-cart-drawer-qty-value">{item.quantity}</span>
                        <button
                          className="izu-cart-drawer-qty-btn"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      className="izu-cart-drawer-item-remove"
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label="Remove item"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="izu-cart-drawer-footer">
            <div className="izu-cart-drawer-total">
              <span>Subtotal</span>
              <span>৳{cartTotal.toLocaleString("en-BD")}</span>
            </div>
            <button className="izu-cart-drawer-checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
