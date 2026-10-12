import React, { useEffect, useState } from "react";
import Navbar from "../components/home/Navbar";
import HeroSection from "../components/home/HeroSection";
import CategoriesSection from "../components/home/CategoriesSection";
import ProductsSection from "../components/home/ProductsSection";
import Footer from "../components/home/Footer";
import CartModal from "../components/cart/CartModal";
import "../styles/storefront.css";

export default function HomePage({
  isAuthenticated,
  fullName,
  onLoginClick,
  onSignupClick,
  onLogout,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [theme, setTheme] = useState(() => localStorage.getItem("techlite_theme") || "light");

  useEffect(() => {
    localStorage.setItem("techlite_theme", theme);
  }, [theme]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    document.getElementById("mobiles")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="home-page" data-theme={theme}>
      <Navbar
        isAuthenticated={isAuthenticated}
        fullName={fullName}
        onLoginClick={onLoginClick}
        onSignupClick={onSignupClick}
        onLogout={onLogout}
        theme={theme}
        onThemeToggle={() => setTheme(theme === "light" ? "dark" : "light")}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <HeroSection fullName={fullName} />

      <CategoriesSection
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />

      <ProductsSection
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
      />

      <Footer />

      {/* Cart Drawer */}
      <CartModal />
    </div>
  );
}
