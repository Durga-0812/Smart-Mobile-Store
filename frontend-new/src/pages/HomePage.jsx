import React, { useEffect, useState } from "react";
import Navbar from "../components/home/Navbar";
import HeroSection from "../components/home/HeroSection";
import CategoriesSection from "../components/home/CategoriesSection";
import ProductsSection from "../components/home/ProductsSection";
import Footer from "../components/home/Footer";
import CartModal from "../components/cart/CartModal";
import MyOrdersPanel from "../components/orders/MyOrdersPanel";
import { useCart } from "../hooks/useCart";
import "../styles/storefront.css";

const API_URL = "http://127.0.0.1:8000/api/v1/products/";

export default function HomePage({
  isAuthenticated,
  fullName,
  onLoginClick,
  onSignupClick,
  onLogout,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [showOrders, setShowOrders] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("techlite_theme") || "light"
  );

  const {
    isCartOpen,
    setIsCartOpen,
    cartError,
    dismissCartError,
  } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("techlite_theme", theme);
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Unable to load products (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        const productList = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : Array.isArray(data.items)
              ? data.items
              : null;

        if (!productList) {
          throw new Error(
            "The products API returned an unexpected response."
          );
        }

        setProducts(productList);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Product loading error:", err);
          setError(
            err.message || "Could not connect to the product server."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => controller.abort();
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);

    document.getElementById("mobiles")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="home-page" data-theme={theme}>
      <Navbar
        isAuthenticated={isAuthenticated}
        fullName={fullName}
        onLoginClick={onLoginClick}
        onSignupClick={onSignupClick}
        onLogout={onLogout}
        onHomeClick={() => setShowOrders(false)}
        onMyOrdersClick={() => setShowOrders(true)}
        theme={theme}
        onThemeToggle={() =>
          setTheme((currentTheme) =>
            currentTheme === "light" ? "dark" : "light"
          )
        }
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {cartError && (
        <div className="cart-sync-error" role="alert">
          <span>{cartError}</span>
          <button type="button" onClick={dismissCartError} aria-label="Dismiss cart error">
            ×
          </button>
        </div>
      )}

      {showOrders ? (
        <MyOrdersPanel onBack={() => setShowOrders(false)} />
      ) : (
        <>
          <CategoriesSection
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />

          <HeroSection
            fullName={fullName}
            onCategorySelect={handleCategorySelect}
          />

          {loading ? (
            <section className="products" id="mobiles">
              <h2>The TechLite Collection</h2>
              <p>Loading products...</p>
            </section>
          ) : error ? (
            <section className="products" id="mobiles">
              <h2>The TechLite Collection</h2>
              <p role="alert">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </section>
          ) : (
            <ProductsSection
              products={products}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              isAuthenticated={isAuthenticated}
              fullName={fullName}
              onLoginClick={onLoginClick}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          )}
        </>
      )}

      <Footer />

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        isAuthenticated={isAuthenticated}
        onLoginClick={onLoginClick}
        onSignupClick={onSignupClick}
      />
    </div>
  );
}