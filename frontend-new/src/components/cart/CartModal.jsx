
import { useMemo, useState } from "react";
import { useCart } from "../../hooks/useCart";
import "./CartModal.css";

const FREE_SHIPPING_LIMIT = 2000;
const SHIPPING_CHARGE = 99;
const TAX_RATE = 0.1;
const API_URL = "http://127.0.0.1:8000/api/v1";

export default function CartModal({ isOpen, onClose }) {
  const {
    cartItems = [],
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum +
          Number(item.priceNum ?? item.price ?? 0) *
            Number(item.quantity ?? 1),
        0
      ),
    [cartItems]
  );

  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_LIMIT
      ? 0
      : SHIPPING_CHARGE;

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + tax + shipping;

  const itemCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity ?? 1),
    0
  );

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price) || 0);

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleQuantity = (item, change) => {
    const currentQuantity = Number(item.quantity ?? 1);

    if (currentQuantity + change < 1) return;

    updateQuantity(item.id, change);
    showMessage("");
  };

  const handleRemove = (item) => {
    removeFromCart(item.id);

    setCoupon("");
    setAppliedCoupon("");
    setDiscount(0);

    showMessage(`${item.name} removed from your cart.`, "success");
  };

  const handleApplyCoupon = () => {
    const code = coupon.trim().toUpperCase();

    if (!code) {
      setAppliedCoupon("");
      setDiscount(0);
      showMessage("Please enter a coupon code.", "error");
      return;
    }

    if (cartItems.length === 0 || subtotal <= 0) {
      setAppliedCoupon("");
      setDiscount(0);
      showMessage("Add products before applying a coupon.", "error");
      return;
    }

    if (code === "SAVE10") {
      const amount = subtotal * 0.1;

      setCoupon(code);
      setAppliedCoupon(code);
      setDiscount(amount);

      showMessage(
        `Coupon applied! You saved ${formatPrice(amount)}.`,
        "success"
      );
      return;
    }

    if (code === "SAVE200") {
      if (subtotal < 2000) {
        setAppliedCoupon("");
        setDiscount(0);

        showMessage(
          "SAVE200 requires a subtotal of at least ₹2,000.",
          "error"
        );
        return;
      }

      setCoupon(code);
      setAppliedCoupon(code);
      setDiscount(200);

      showMessage("Coupon applied! You saved ₹200.", "success");
      return;
    }

    setAppliedCoupon("");
    setDiscount(0);
    showMessage("Invalid coupon code.", "error");
  };

  const handleClearCart = () => {
    clearCart();
    setCoupon("");
    setAppliedCoupon("");
    setDiscount(0);

    showMessage("Your cart has been cleared.", "success");
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showMessage("Your cart is empty.", "error");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      showMessage("Please log in before checkout.", "error");
      return;
    }

    try {
      setCheckoutLoading(true);
      showMessage("");

      const response = await fetch(`${API_URL}/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            product_id: String(item.id),
            quantity: Number(item.quantity ?? 1),
          })),
          coupon_code: appliedCoupon || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = data.detail;

        const errorMessage = Array.isArray(detail)
          ? detail.map((error) => error.msg).join(", ")
          : typeof detail === "string"
            ? detail
            : "Checkout failed. Please try again.";

        throw new Error(errorMessage);
      }

      setOrderSuccess(data);
      clearCart();

      setCoupon("");
      setAppliedCoupon("");
      setDiscount(0);

      showMessage("Order placed successfully!", "success");
    } catch (error) {
      showMessage(
        error.message || "Unable to place your order.",
        "error"
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cart-backdrop" onClick={onClose}>
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cart-header">
          <div className="cart-header-title">
            <h2>Your Cart</h2>
            <span className="cart-badge-count">
              {orderSuccess ? 0 : itemCount}
            </span>
          </div>

          <button
            type="button"
            className="cart-close-btn"
            onClick={onClose}
            aria-label="Close cart"
          >
            ×
          </button>
        </header>

        <div className="cart-content">
          {orderSuccess ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">✅</div>
              <h3>Order placed successfully!</h3>
              <p>
                Thank you for shopping with TechLite.
              </p>
              <p>
                Order ID: {orderSuccess.id ?? "Confirmed"}
              </p>
              {orderSuccess.status && (
                <p>Status: {orderSuccess.status}</p>
              )}
              <p>
                Total:{" "}
                {formatPrice(
                  orderSuccess.total ??
                    orderSuccess.total_amount ??
                    total
                )}
              </p>

              <button
                type="button"
                className="cart-browse-btn"
                onClick={() => {
                  setOrderSuccess(null);
                  setMessage("");
                  onClose();
                }}
              >
                Continue Shopping
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Add your favourite products to get started.</p>

              <button
                type="button"
                className="cart-browse-btn"
                onClick={onClose}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => {
                const price = Number(
                  item.priceNum ?? item.price ?? 0
                );
                const quantity = Number(item.quantity ?? 1);

                return (
                  <article className="cart-item" key={item.id}>
                    <img
                      className="cart-item-image"
                      src={
                        item.image_url ||
                        item.image ||
                        "https://placehold.co/100x100?text=Product"
                      }
                      alt={item.name || "Product"}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "https://placehold.co/100x100?text=Product";
                      }}
                    />

                    <div className="cart-item-details">
                      <div className="cart-item-header">
                        <div>
                          <h3>{item.name}</h3>
                          <p className="cart-item-price">
                            {formatPrice(price)}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="cart-item-delete"
                          onClick={() => handleRemove(item)}
                          aria-label={`Remove ${item.name}`}
                          title="Remove item"
                        >
                          ×
                        </button>
                      </div>

                      <div className="cart-item-actions">
                        <div className="cart-qty-selector">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantity(item, -1)
                            }
                            disabled={quantity <= 1}
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            −
                          </button>

                          <span>{quantity}</span>

                          <button
                            type="button"
                            onClick={() =>
                              handleQuantity(item, 1)
                            }
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            +
                          </button>
                        </div>

                        <strong className="cart-item-subtotal">
                          {formatPrice(price * quantity)}
                        </strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {!orderSuccess && cartItems.length > 0 && (
          <footer className="cart-footer">
            <div className="cart-coupon">
              <label htmlFor="cart-coupon-input">
                Coupon code
              </label>

              <div className="cart-coupon-controls">
                <input
                  id="cart-coupon-input"
                  type="text"
                  value={coupon}
                  onChange={(event) =>
                    setCoupon(event.target.value)
                  }
                  placeholder="Enter coupon code"
                  autoComplete="off"
                />

                <button
                  type="button"
                  onClick={handleApplyCoupon}
                >
                  Apply
                </button>
              </div>

              <small>
                SAVE10: 10% off. SAVE200: ₹200 off on a
                subtotal of ₹2,000 or more.
              </small>
            </div>

            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div className="cart-summary-row">
                <span>Discount ({appliedCoupon})</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}

            <div className="cart-summary-row">
              <span>Tax (10%)</span>
              <span>{formatPrice(tax)}</span>
            </div>

            <div className="cart-summary-row">
              <span>Shipping</span>
              <span>
                {shipping === 0
                  ? "FREE"
                  : formatPrice(shipping)}
              </span>
            </div>

            <div className="cart-free-shipping">
              {subtotal >= FREE_SHIPPING_LIMIT
                ? "You've unlocked free shipping!"
                : `Add ${formatPrice(
                    FREE_SHIPPING_LIMIT - subtotal
                  )} more for free shipping.`}
            </div>

            <div className="cart-total-row">
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>

            {message && (
              <p
                className={`cart-message cart-message-${messageType}`}
                role="status"
                aria-live="polite"
              >
                {message}
              </p>
            )}

            <button
              type="button"
              className="cart-checkout-btn"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading
                ? "Placing Order..."
                : "Proceed to Checkout"}
            </button>

            <button
              type="button"
              className="cart-clear-btn"
              onClick={handleClearCart}
              disabled={checkoutLoading}
            >
              Clear Cart
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}