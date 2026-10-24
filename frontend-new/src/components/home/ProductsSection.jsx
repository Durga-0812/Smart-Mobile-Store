import React from "react";
import ProductCard from "./ProductCard";
import { DEFAULT_PRODUCTS } from "../../data/products";
import { getCategoryId } from "../../data/categories";
import "./ProductsSection.css";

const CATEGORY_PROMPTS = {
  all: "your next tech upgrade",
  mobiles: "your next-gen mobile",
  laptops: "a laptop built for big ideas",
  earbuds: "your next listening favourite",
  chargers: "a faster way to stay powered",
  cases: "a case that fits your style",
  smartwatches: "a smarter everyday companion",
  accessories: "the perfect tech essentials",
};

export default function ProductsSection({
  products = DEFAULT_PRODUCTS,
  searchQuery = "",
  selectedCategory = "all",
  isAuthenticated = false,
  fullName = "",
  onLoginClick,
  sortBy = "relevance",
  onSortChange,
  onProductClick,
}) {

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const categoryPrompt =
    CATEGORY_PROMPTS[selectedCategory] || "your next tech upgrade";
  const greetingName = fullName.trim().split(/\s+/)[0] || "Tech explorer";
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = String(product.name || "")
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesCategory =
        selectedCategory === "all" ||
        getCategoryId(product.category) === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((first, second) => {
      const firstPrice = Number(first.price ?? first.priceNum) || 0;
      const secondPrice = Number(second.price ?? second.priceNum) || 0;

      if (sortBy === "price-low-high") return firstPrice - secondPrice;
      if (sortBy === "price-high-low") return secondPrice - firstPrice;
      if (sortBy === "name-a-z") {
        return String(first.name || "").localeCompare(String(second.name || ""));
      }
      if (sortBy === "relevance" && normalizedSearch) {
        const firstStartsWith = String(first.name || "")
          .toLowerCase()
          .startsWith(normalizedSearch);
        const secondStartsWith = String(second.name || "")
          .toLowerCase()
          .startsWith(normalizedSearch);
        return Number(secondStartsWith) - Number(firstStartsWith);
      }
      return 0;
    });

  return (
    <section className="products" id="mobiles">
      <div className="products-personalized">
        <span className="products-personalized-mark" aria-hidden="true">✦</span>
        <h2>
          {greetingName}, looking for {categoryPrompt}? You&apos;re at the right spot!
        </h2>
        <p>Thoughtfully selected tech, all in one place.</p>
      </div>

      <div className="products-heading">
        <h3>{selectedCategory === "all" ? "The TechLite Collection" : `Shop ${selectedCategory}`}</h3>
        <label className="product-sort">
          <span>Sort by</span>
          <select
            value={sortBy}
            onChange={(event) => onSortChange?.(event.target.value)}
            aria-label="Sort products"
          >
            <option value="relevance">Relevance</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
            <option value="name-a-z">Name: A to Z</option>
          </select>
        </label>
      </div>

      {filteredProducts.length === 0 ? (
        <p className="no-products-msg">
          No products found matching "{searchQuery}".
        </p>
      ) : (
        <div className="product-container">
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              isAuthenticated={isAuthenticated}
              onLoginClick={onLoginClick}
            />
          ))}
        </div>
      )}
    </section>
  );
}
