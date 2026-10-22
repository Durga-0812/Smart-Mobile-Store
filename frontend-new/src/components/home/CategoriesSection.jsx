import React from "react";
import { PRODUCT_CATEGORIES } from "../../data/categories";
import "./CategoriesSection.css";

const CATEGORIES = [
  {
    id: "all",
    name: "For You",
    icon: "✨",
  },
  ...PRODUCT_CATEGORIES,
];

export default function CategoriesSection({ selectedCategory, onSelectCategory }) {
  return (
    <nav className="categories" aria-label="Shop categories">
      <div className="categories-inner">
        <div className="category-box">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`category ${selectedCategory === category.id ? "active" : ""}`}
              onClick={() => onSelectCategory?.(category.id)}
              type="button"
              aria-pressed={selectedCategory === category.id}
            >
              <span className="category-icon" aria-hidden="true">
                {category.icon}
              </span>
              <span className="category-name">{category.name}</span>
              <span className="category-arrow" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
