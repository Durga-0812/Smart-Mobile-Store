import React, { useState } from "react";
import { useCart } from "../../hooks/useCart";
import { CartIcon, MoonIcon, SunIcon, UserIcon } from "../common/Icons";
import "./Navbar.css";

export default function Navbar({
  isAuthenticated,
  fullName,
  onLoginClick,
  onSignupClick,
  onLogout,
  onHomeClick,
  onMyOrdersClick,
  searchQuery,
  setSearchQuery,
  onSearch,
  theme,
  onThemeToggle,
}) {
  const { totalItems, setIsCartOpen } = useCart();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  return (
    <nav className="home-nav">
      <div className="home-logo">
        <a href="#home">
          Tech <span>Lite</span>
        </a>
      </div>

      <form className="home-search" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery || ""}
          onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <div className="home-menu">
        <a href="#home" onClick={onHomeClick}>Home</a>

        <button
          type="button"
          className="home-cart-btn"
          onClick={() => setIsCartOpen(true)}
          aria-label={
            isAuthenticated
              ? `Open Your bag${totalItems ? `, ${totalItems} items` : ""}`
              : "Open your bag to log in or create an account"
          }
        >
          <CartIcon size={18} />
          <span>Your bag</span>
          {isAuthenticated && totalItems > 0 && (
            <span className="cart-nav-badge">{totalItems}</span>
          )}
        </button>

        <button
          type="button"
          className="theme-toggle"
          onClick={onThemeToggle}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>

        <div className="home-auth-buttons">
          {isAuthenticated ? (
            <div className="profile-menu-wrap">
              <button
                type="button"
                className="profile-button"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
              >
                <UserIcon />
                <span>{fullName ? fullName.split(" ")[0] : "My account"}</span>
              </button>
              {isAccountMenuOpen && (
                <div className="profile-menu" role="menu">
                  <span className="profile-menu-name">{fullName || "TechLite member"}</span>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onMyOrdersClick?.();
                    }}
                  >
                    My orders
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onLogout?.();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                className="profile-button"
                onClick={onLoginClick}
              >
                <UserIcon />
                <span>Login</span>
              </button>
              <button
                type="button"
                className="home-signup"
                onClick={onSignupClick}
              >
                Create account
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
