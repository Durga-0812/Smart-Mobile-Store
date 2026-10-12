import React, { useState } from "react";
import HomePage from "./pages/HomePage";
import AuthPage from "./components/auth/AuthPage";
import { CartProvider } from "./context/CartContext";

export default function App() {
  const [mode, setMode] = useState("login");
  const [showAuth, setShowAuth] = useState(false);
  const [authenticated, setAuthenticated] = useState(
    Boolean(localStorage.getItem("access_token"))
  );
  const [fullName, setFullName] = useState(
    localStorage.getItem("full_name") || ""
  );

  const handleLoginClick = () => {
    setMode("login");
    setShowAuth(true);
  };

  const handleSignupClick = () => {
    setMode("signup");
    setShowAuth(true);
  };

  const handleLoginSuccess = (data) => {
    setAuthenticated(true);
    setFullName(data?.full_name || localStorage.getItem("full_name") || "");
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("full_name");
    localStorage.removeItem("remember_me");

    setAuthenticated(false);
    setFullName("");
    setShowAuth(false);
    setMode("login");
  };

  return (
    <CartProvider>
      {showAuth ? (
        <AuthPage
          mode={mode}
          setMode={setMode}
          onClose={() => setShowAuth(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <HomePage
          isAuthenticated={authenticated}
          fullName={fullName}
          onLoginClick={handleLoginClick}
          onSignupClick={handleSignupClick}
          onLogout={handleLogout}
        />
      )}
    </CartProvider>
  );
}
