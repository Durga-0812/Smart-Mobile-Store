import React, { useState } from "react";
import { useCart } from "../../hooks/useCart";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const hasProductPhoto =
    typeof product.image === "string" &&
    (/^https?:\/\//i.test(product.image) ||
      /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(product.image));

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="product">
      <div className="product-image">
        {hasProductPhoto ? (
          <img src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-render">
            <span className="product-render-camera" />
          </div>
        )}
      </div>
      <h3>{product.name}</h3>
      <p className="price">₹{product.priceNum.toLocaleString("en-IN")}</p>
      <button
        className={`buy-btn ${added ? "added" : ""}`}
        type="button"
        onClick={handleAdd}
      >
        {added ? "Added! ✓" : "Add to Cart"}
      </button>
    </div>
  );
}
