import React, { useState } from "react";
import HomePage from "./pages/HomePage";
import AuthPage from "./components/auth/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import { CartProvider } from "./context/CartContext";

export default function App() {
  const [mode, setMode] = useState("login");
  const [loginRole, setLoginRole] = useState("USER");
  const [showAuth, setShowAuth] = useState(false);

  const [authenticated, setAuthenticated] = useState(
    Boolean(localStorage.getItem("access_token"))
  );

  const [role, setRole] = useState(
    localStorage.getItem("role") || "USER"
  );

  const [fullName, setFullName] = useState(
    localStorage.getItem("full_name") || ""
  );

  const handleLoginClick = () => {
    setMode("login");
    setLoginRole("USER");
    setShowAuth(true);
  };

  const handleAdminLoginClick = () => {
    setMode("login");
    setLoginRole("ADMIN");
    setShowAuth(true);
  };

  const handleSignupClick = () => {
    setMode("signup");
    setLoginRole("USER");
    setShowAuth(true);
  };

  const handleLoginSuccess = (data) => {
    const actualRole = String(data?.role || "").toUpperCase();

    if (actualRole !== "USER" && actualRole !== "ADMIN") {
      localStorage.removeItem("access_token");
      setShowAuth(true);
      return;
    }

    localStorage.setItem("role", actualRole);
    localStorage.setItem("full_name", data.full_name || "");

    setRole(actualRole);
    setFullName(data.full_name || "");
    setAuthenticated(true);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("full_name");
    localStorage.removeItem("remember_me");
    localStorage.removeItem("role");

    setAuthenticated(false);
    setFullName("");
    setRole("USER");
    setShowAuth(false);
    setMode("login");
    setLoginRole("USER");
  };

  return (
    <CartProvider
      key={authenticated && role === "USER" ? "user-cart" : "guest-cart"}
      isAuthenticated={authenticated && role === "USER"}
    >
      {authenticated && role === "ADMIN" ? (
        <AdminDashboard
          fullName={fullName}
          onLogout={handleLogout}
        />
      ) : (
        <>
          <HomePage
            isAuthenticated={authenticated}
            fullName={fullName}
            onLoginClick={handleLoginClick}
            onSignupClick={handleSignupClick}
            onAdminLoginClick={handleAdminLoginClick}
            onLogout={handleLogout}
          />
          {showAuth && (
            <AuthPage
              mode={mode}
              setMode={setMode}
              loginRole={loginRole}
              setLoginRole={setLoginRole}
              onClose={() => setShowAuth(false)}
              onLoginSuccess={handleLoginSuccess}
            />
          )}
        </>
      )}
    </CartProvider>
  );
}