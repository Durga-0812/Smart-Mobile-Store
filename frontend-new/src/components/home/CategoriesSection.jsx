import React from "react";
import "./CategoriesSection.css";

const CATEGORIES = [
  { id: "all", name: "All Products", icon: "✦" },
  { id: "smartphones", name: "Smartphones", icon: "📱" },
  { id: "earbuds", name: "Earbuds", icon: "🎧" },
  { id: "chargers", name: "Chargers", icon: "🔌" },
  { id: "cases", name: "Cases", icon: "📦" },
  { id: "smartwatches", name: "Smart Watches", icon: "⌚" },
  {id: "Laptops", name: "Laptops", icon: "💻" },
];

export default function CategoriesSection({ selectedCategory, onSelectCategory }) {
  return (
    <section className="categories" id="categories">
      <h2>Shop By Category</h2>

      <div className="category-box">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`category ${selectedCategory === cat.id ? "active" : ""}`}
            onClick={() => onSelectCategory && onSelectCategory(cat.id)}
            type="button"
            aria-pressed={selectedCategory === cat.id}
          >
            <div className="icon" aria-hidden="true">
              {cat.icon}
            </div>
            <h3>{cat.name}</h3>
          </button>
        ))}
      </div>
    </section>
  );
}
