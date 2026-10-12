import React from "react";
import { useCart } from "../../hooks/useCart";
import { CloseIcon, TrashIcon, PlusIcon, MinusIcon } from "../common/Icons";
import "./CartModal.css";

export default function CartModal() {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    totalItems,
  } = useCart();

  if (!isCartOpen) return null;

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const hasProductPhoto = (image) =>
    typeof image === "string" &&
    (/^https?:\/\//i.test(image) ||
      /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(image));

  return (
    <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}>
      <aside
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="Shopping Cart"
      >
        <header className="cart-header">
          <div className="cart-header-title">
            <h2>Your Cart</h2>
            <span className="cart-badge-count">{totalItems} items</span>
          </div>

          <button
            type="button"
            className="cart-close-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <CloseIcon size={22} />
          </button>
        </header>

        <div className="cart-content">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty-icon">🛒</span>
              <h3>Your cart is empty</h3>
              <p>Looks like you haven't added any mobiles yet.</p>
              <button
                type="button"
                className="cart-browse-btn"
                onClick={() => setIsCartOpen(false)}
              >
                Browse Mobiles
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    {hasProductPhoto(item.image) ? (
                      <img src={item.image} alt="" />
                    ) : (
                      item.image || "📱"
                    )}
                  </div>

                  <div className="cart-item-details">
                    <div className="cart-item-header">
                      <h4>{item.name}</h4>
                      <button
                        type="button"
                        className="cart-item-delete"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>

                    <div className="cart-item-price">
                      {formatPrice(item.priceNum)}
                    </div>

                    <div className="cart-item-actions">
                      <div className="cart-qty-selector">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label="Increase quantity"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>

                      <div className="cart-item-subtotal">
                        {formatPrice(item.priceNum * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <footer className="cart-footer">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Shipping</span>
              <span className="cart-free-shipping">FREE</span>
            </div>
            <div className="cart-summary-row cart-total-row">
              <strong>Total</strong>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>

            <button
              type="button"
              className="cart-checkout-btn"
              onClick={() => {
                alert("Thank you for your order! Checkout process initiated.");
                clearCart();
                setIsCartOpen(false);
              }}
            >
              Proceed to Checkout
            </button>

            <button
              type="button"
              className="cart-clear-btn"
              onClick={clearCart}
            >
              Clear Cart
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
