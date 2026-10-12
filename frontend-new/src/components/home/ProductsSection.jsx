import React from "react";
import ProductCard from "./ProductCard";
import { DEFAULT_PRODUCTS } from "../../data/products";
import "./ProductsSection.css";

export default function ProductsSection({
  products = DEFAULT_PRODUCTS,
  searchQuery = "",
  selectedCategory = "all",
}) {
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <section className="products" id="mobiles">
      <h2>{selectedCategory === "all" ? "The TechLite Collection" : `Shop ${selectedCategory}`}</h2>

      {filteredProducts.length === 0 ? (
        <p className="no-products-msg">
          No products found matching "{searchQuery}".
        </p>
      ) : (
        <div className="product-container">
          {filteredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </section>
  );
}
