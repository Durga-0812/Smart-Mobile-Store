import React from "react";
import { getProductImageUrl } from "../utils/productImages";
import { useCart } from "../hooks/useCart";

export default function ProductDetails({
product,
onBack,
isAuthenticated = false,
onLoginClick,
}) {
const { addToCart } = useCart();

if (!product) {
return ( <section className="product-details"> <h2>Product not found</h2> <button type="button" onClick={onBack}>
Back to Products </button> </section>
);
}

const price = Number(product.price ?? product.priceNum);
const image = getProductImageUrl(product);
const stock = Number(product.stock_quantity);
const hasStockInfo =
product.stock_quantity !== undefined &&
product.stock_quantity !== null &&
Number.isFinite(stock);

const handleAddToCart = async () => {
if (!isAuthenticated) {
onLoginClick?.();
return;
}

```
if (hasStockInfo && stock <= 0) {
  return;
}

try {
  await addToCart(product);
  alert("Product added to cart!");
} catch (error) {
  alert(error.message || "Unable to add product to cart.");
}
```

};

return ( <section className="product-details"> <button type="button" onClick={onBack}>
← Back to Products </button>

```
  <div className="product-details-content">
    <div className="product-details-image">
      {image ? (
        <img src={image} alt={product.name || "Mobile phone"} />
      ) : (
        <p>No product image available</p>
      )}
    </div>

    <div className="product-details-info">
      <h1>{product.name || "Unnamed Product"}</h1>

      <h2>
        {Number.isFinite(price)
          ? `₹${price.toLocaleString("en-IN")}`
          : "Price unavailable"}
      </h2>

      <p>
        <strong>Brand:</strong> {product.brand || "Not specified"}
      </p>

      <p>
        <strong>Category:</strong> {product.category || "Not specified"}
      </p>

      {product.description && (
        <p>
          <strong>Description:</strong> {product.description}
        </p>
      )}

      {hasStockInfo && (
        <p>
          <strong>Availability:</strong>{" "}
          {stock > 0 ? `${stock} available` : "Out of stock"}
        </p>
      )}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={hasStockInfo && stock <= 0}
      >
        {!isAuthenticated
          ? "Login to Add to Cart"
          : hasStockInfo && stock <= 0
            ? "Out of Stock"
            : "Add to Cart"}
      </button>
    </div>
  </div>
</section>


);
}
