import React, { useState } from "react";
import { useCart } from "../../hooks/useCart";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  // Support both frontend and backend field names.
  const price = Number(product.price ?? product.priceNum);
  const image = product.image ?? product.image_url ?? "";
  const name = product.name ?? "Unnamed Product";

  const hasProductPhoto =
    typeof image === "string" &&
    image.trim() !== "" &&
    (/^https?:\/\//i.test(image) ||
      /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(image));

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="product">
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

      <button
        className={`buy-btn ${added ? "added" : ""}`}
        type="button"
        onClick={handleAdd}
        disabled={!Number.isFinite(price)}
      >
        {added ? "Added! ✓" : "Add to Cart"}
      </button>
    </div>
  );
}