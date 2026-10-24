import React, { useState } from "react";
import { useCart } from "../../hooks/useCart";
import { getProductImageUrl } from "../../utils/productImages";

export default function ProductCard({
  product,
  isAuthenticated = false,
  onLoginClick,
  onProductClick,
}) {
  const { addToCart, cartItems = [] } = useCart();
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Support both frontend and backend field names.
  const price = Number(product.price ?? product.priceNum);
  const image = getProductImageUrl(product);
  const name = product.name ?? "Unnamed Product";
  const cartQuantity = Number(
    cartItems.find((item) => String(item.id) === String(product.id))
      ?.quantity ?? 0
  );
  const stock = Number(product.stock_quantity);
  const hasStockInfo =
    product.stock_quantity !== undefined &&
    product.stock_quantity !== null &&
    Number.isFinite(stock);
  const outOfStock = hasStockInfo && stock <= 0;
  const stockMessage = outOfStock
    ? "Out of stock"
    : stock <= 5
      ? "Very low stock"
      : stock <= 20
        ? "Only few stock left"
        : "";
  const buttonLabel = outOfStock
    ? "Out of Stock"
    : adding
      ? "Adding..."
      : added
      ? "Added! ✓"
      : isAuthenticated
        ? "Add to Cart"
        : "Login / Sign up to add";

  const hasProductPhoto =
    typeof image === "string" &&
    image.trim() !== "" &&
    (/^https?:\/\//i.test(image) ||
      /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(image));

  const handleAdd = async () => {
    if (outOfStock) return;

    if (!isAuthenticated) {
      onLoginClick?.();
      return;
    }

    setAdding(true);
    setAddError("");
    try {
      await addToCart(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    } catch (error) {
      setAddError(error.message || "Unable to add this product to your cart.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
  className="product"
  onClick={() => onProductClick?.(product)}
  role={onProductClick ? "button" : undefined}
  tabIndex={onProductClick ? 0 : undefined}
  onKeyDown={(event) => {
    if (
      event.target === event.currentTarget &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      onProductClick?.(product);
    }
  }}
>
      <div className="product-image">
        {hasProductPhoto ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <div className="product-render">
            <span className="product-render-camera" />
          </div>
        )}
      </div>

      <h3>{name}</h3>

      <p className="price">
        ₹
        {Number.isFinite(price)
          ? price.toLocaleString("en-IN")
          : "Price unavailable"}
      </p>

      {hasStockInfo && stockMessage && (
        <p
          className={`product-stock ${stock <= 5 ? "product-stock-low" : ""}`}
          role="status"
        >
          {stockMessage}
        </p>
      )}

      {addError && (
        <p className="product-cart-error" role="alert">
          {addError}
        </p>
      )}

      <button
        className={`buy-btn ${added ? "added" : ""} ${!isAuthenticated ? "login-required" : ""}`}
        type="button"
        onClick={(event) => {
  event.stopPropagation();
  handleAdd();
}}
        disabled={
          adding ||
          outOfStock ||
          (isAuthenticated && !Number.isFinite(price))
        }
      >
        <span>{buttonLabel}</span>
        {cartQuantity > 0 && isAuthenticated && !outOfStock && (
          <span
            className="buy-btn-cart-count"
            aria-label={`${cartQuantity} in cart`}
          >
            {cartQuantity}
          </span>
        )}
      </button>
    </div>
  );
}