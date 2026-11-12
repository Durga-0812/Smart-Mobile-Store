import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useCart } from "../../hooks/useCart";
import DeliveryLocation from "../DeliveryLocation";
import "./CartModal.css";

const FREE_SHIPPING_LIMIT = 2000;
const SHIPPING_CHARGE = 99;
const TAX_RATE = 0.1;
const API_URL = "/api/v1";

export default function CartModal({
  isOpen,
  onClose,
  isAuthenticated = false,
  onLoginClick,
  onSignupClick,
}) {
  const {
    cartItems = [],
    updateQuantity,
    removeFromCart,
    clearCart,
    clearLocalCart,
  } = useCart();

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [paymentStep, setPaymentStep] = useState(false);
  const [deliveryStep, setDeliveryStep] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [demoReference, setDemoReference] = useState("");
  const [orderIdCopied, setOrderIdCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

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

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderSuccess.id);
      setOrderIdCopied(true);
      setCopyError("");
      window.setTimeout(() => setOrderIdCopied(false), 1800);
    } catch {
      setCopyError("Could not copy the order ID.");
    }
  };

  const handleQuantity = async (item, change) => {
    if (!isAuthenticated) {
      onLoginClick?.();
      return;
    }

    const currentQuantity = Number(item.quantity ?? 1);

    if (currentQuantity + change < 1) return;

    try {
      await updateQuantity(item.id, change);
      showMessage("");
    } catch (error) {
      showMessage(error.message || "Unable to update quantity.", "error");
    }
  };

  const handleRemove = async (item) => {
    if (!isAuthenticated) {
      onLoginClick?.();
      return;
    }

    try {
      await removeFromCart(item.id);
    } catch (error) {
      showMessage(error.message || "Unable to remove product.", "error");
      return;
    }

    setCoupon("");
    setAppliedCoupon("");
    setDiscount(0);

    showMessage(`${item.name} removed from your cart.`, "success");
  };

  const handleApplyCoupon = () => {
    const code = coupon.trim().toUpperCase();

    if (!code) {
      showMessage("Please enter a coupon code.", "error");
      return;
    }

    if (cartItems.length === 0 || subtotal <= 0) {
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

  const handleClearCart = async () => {
    if (!isAuthenticated) {
      onLoginClick?.();
      return;
    }

    try {
      await clearCart();
    } catch (error) {
      showMessage(error.message || "Unable to clear cart.", "error");
      return;
    }

    setCoupon("");
    setAppliedCoupon("");
    setDiscount(0);
    showMessage("Your cart has been cleared.", "success");
  };

  // Open the demo payment screen.
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showMessage("Your cart is empty.", "error");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      showMessage("Please log in before checkout.", "error");
      return;
    }

    const reference =
      globalThis.crypto?.randomUUID?.() ||
      `TL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setDemoReference(reference);
    setDeliveryStep(true);
    setPaymentStep(false);
    showMessage("");
  };

  // This is a DEMO action, not a real payment confirmation.
const handleDemoPayment = async () => {
  if (!deliveryLocation) {
    showMessage("Please select a delivery location.", "error");
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
  delivery_address: deliveryLocation?.address || null,
  delivery_latitude: deliveryLocation?.latitude ?? null,
  delivery_longitude: deliveryLocation?.longitude ?? null,
}),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = data.detail;

        const errorMessage = Array.isArray(detail)
          ? detail.map((error) => error.msg).join(", ")
          : typeof detail === "string"
            ? detail
            : "Order creation failed. Please try again.";

        throw new Error(errorMessage);
      }

      setOrderSuccess(data);
      setPaymentStep(false);
      clearLocalCart();

      setCoupon("");
      setAppliedCoupon("");
      setDiscount(0);

      showMessage("Demo order created successfully!", "success");
    } catch (error) {
      showMessage(
        error.message || "Unable to create order.",
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
            <h2>
             {orderSuccess
  ? "Order Receipt"
  : deliveryStep
    ? "Select Delivery Location"
    : paymentStep
      ? "Scan & Pay"
      : "Your Cart"}
            </h2>

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

          {/* ORDER RECEIPT */}
          {orderSuccess ? (
            <div className="cart-empty cart-receipt-view">
              <section className="cart-receipt">
                <div className="cart-receipt-brand">TechLite</div>

                <h3>Order placed successfully!</h3>

                <p className="cart-receipt-thanks">
                  Thank you for shopping with TechLite.
                </p>

                <div className="cart-demo-payment-label">
                  DEMO PAYMENT — NOT A REAL TRANSACTION
                </div>

                <dl className="cart-receipt-meta">
                  <div>
                    <dt>Order ID</dt>
                    <dd className="cart-receipt-order-id">
                      <code>{orderSuccess.id}</code>

                      <button
                        type="button"
                        className="cart-copy-order-id"
                        onClick={handleCopyOrderId}
                      >
                        {orderIdCopied ? "Copied" : "Copy"}
                      </button>
                    </dd>
                  </div>

                  <div>
                    <dt>Order date</dt>
                    <dd>
                      {new Date(
                        orderSuccess.created_at
                      ).toLocaleString("en-IN")}
                    </dd>
                  </div>

                  <div>
                    <dt>Status</dt>
                    <dd>{orderSuccess.status}</dd>
                  </div>
                </dl>

                {copyError && (
                  <p className="cart-receipt-copy-error">
                    {copyError}
                  </p>
                )}

                <p className="cart-receipt-status-note">
                  Your demo order has been created and is awaiting processing.
                </p>

                <div className="cart-receipt-items">
                  <div className="cart-receipt-row cart-receipt-items-heading">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Amount</span>
                  </div>

                  {(orderSuccess.items ?? []).map((item) => (
                    <div className="cart-receipt-row" key={item.id}>
                      <span>
                        {item.product_name}
                        <small>
                          {formatPrice(item.unit_price)} each
                        </small>
                      </span>

                      <span>{item.quantity}</span>
                      <span>{formatPrice(item.line_total)}</span>
                    </div>
                  ))}
                </div>

                <div className="cart-receipt-summary">
                  <div>
                    <span>Subtotal</span>
                    <span>{formatPrice(orderSuccess.subtotal)}</span>
                  </div>

                  {Number(orderSuccess.discount) > 0 && (
                    <div>
                      <span>Discount</span>
                      <span>
                        -{formatPrice(orderSuccess.discount)}
                      </span>
                    </div>
                  )}

                  <div>
                    <span>Tax</span>
                    <span>{formatPrice(orderSuccess.tax)}</span>
                  </div>

                  <div>
                    <span>Shipping</span>
                    <span>{formatPrice(orderSuccess.shipping)}</span>
                  </div>

                  <div className="cart-receipt-total">
                    <strong>Order total</strong>
                    <strong>{formatPrice(orderSuccess.total)}</strong>
                  </div>
                </div>
              </section>

              <div className="cart-receipt-actions">
                <button
                  type="button"
                  className="cart-print-btn"
                  onClick={() => window.print()}
                >
                  Print Bill
                </button>

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
            </div>

          ) : deliveryStep ? (

  /* DELIVERY LOCATION SCREEN */
  <div className="cart-payment-screen">
    <button
      type="button"
      className="cart-payment-back"
      onClick={() => setDeliveryStep(false)}
    >
      ← Back to Cart
    </button>

    <DeliveryLocation
      onLocationSelect={(location) => setDeliveryLocation(location)}
    />

    {deliveryLocation && (
      <div style={{ padding: "12px" }}>
        <p>Delivery location selected successfully!</p>

        <button
          type="button"
          className="cart-checkout-btn"
          onClick={() => {
            setDeliveryStep(false);
            setPaymentStep(true);
          }}
        >
          Continue to Payment
        </button>
      </div>
    )}
  </div>

) : paymentStep ? (

            /* DEMO SCAN AND PAY SCREEN */
            <div className="cart-payment-screen">

              <button
                type="button"
                className="cart-payment-back"
                onClick={() => {
                  setPaymentStep(false);
                  showMessage("");
                }}
              >
                ← Back to Cart
              </button>

              <div className="cart-payment-brand">
                <span>TechLite</span>
                <span className="cart-payment-secure">DEMO CHECKOUT</span>
              </div>

              <h3>Scan & Pay</h3>

              <p className="cart-payment-description">
                Scan this demonstration QR code to preview the payment
                experience.
              </p>

              <div className="cart-payment-amount">
                <small>Total Amount</small>
                <strong>{formatPrice(total)}</strong>
              </div>

              <div className="cart-demo-qr-container">
                <QRCodeSVG
                  value={JSON.stringify({
                    type: "TECHLITE_DEMO_PAYMENT",
                    reference: demoReference,
                    amount: Number(total.toFixed(2)),
                    currency: "INR",
                  })}
                  size={210}
                  level="H"
                  includeMargin
                />
              </div>

              <div className="cart-demo-qr-warning">
                DEMO QR CODE — NOT A REAL UPI PAYMENT QR
              </div>

              <p className="cart-payment-instruction">
                This QR is for project demonstration only.
                Scanning it will not transfer money.
              </p>

              <div className="cart-payment-apps">
                <span className="cart-payment-app gpay">G Pay</span>
                <span className="cart-payment-app phonepe">PhonePe</span>
                <span className="cart-payment-app paytm">Paytm</span>
              </div>

              <div className="cart-payment-reference">
                Reference: {demoReference}
              </div>

              {message && (
                <p
                  className={`cart-message cart-message-${messageType}`}
                  role="status"
                >
                  {message}
                </p>
              )}

              <button
                type="button"
                className="cart-demo-success-btn"
                onClick={handleDemoPayment}
                disabled={checkoutLoading}
              >
                {checkoutLoading
                  ? "Creating Demo Order..."
                  : "✓ Simulate Payment Success"}
              </button>

              <p className="cart-demo-disclaimer">
                For demonstration only. No payment is collected or verified.
              </p>
            </div>

          ) : !isAuthenticated ? (

            <div className="cart-empty cart-auth-required">
              <div className="cart-empty-icon">🔐</div>
              <h3>Sign in to manage your cart</h3>

              <p>
                Log in or create an account to manage your products.
              </p>

              <div className="cart-auth-actions">
                <button
                  type="button"
                  className="cart-browse-btn"
                  onClick={onLoginClick}
                >
                  Login
                </button>

                <button
                  type="button"
                  className="cart-auth-signup-btn"
                  onClick={onSignupClick}
                >
                  Create account
                </button>
              </div>
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
                        >
                          ×
                        </button>
                      </div>

                      <div className="cart-item-actions">
                        <div className="cart-qty-selector">
                          <button
                            type="button"
                            onClick={() => handleQuantity(item, -1)}
                            disabled={quantity <= 1}
                          >
                            −
                          </button>

                          <span>{quantity}</span>

                          <button
                            type="button"
                            onClick={() => handleQuantity(item, 1)}
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

        {/* CART FOOTER */}
        {!orderSuccess &&
  !deliveryStep &&
  !paymentStep &&
  isAuthenticated &&
  cartItems.length > 0 && (
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
                  {shipping === 0 ? "FREE" : formatPrice(shipping)}
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
                >
                  {message}
                </p>
              )}

              <button
                type="button"
                className="cart-checkout-btn"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </button>

              <button
                type="button"
                className="cart-clear-btn"
                onClick={handleClearCart}
              >
                Clear Cart
              </button>
            </footer>
          )}
      </aside>
    </div>
  );
}