import React, { useState } from "react";
import InputField from "../common/InputField";
import { MailIcon, LockIcon } from "../common/Icons";

export default function LoginForm({ onSuccess, role = "USER" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

    
const response = await fetch("https://smart-mobile-store.onrender.com/api/v1/auth/login", 
   {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail?.[0]?.msg ||
          data.detail ||
          "Failed to Login"
        );
      }

    
localStorage.setItem("access_token", data.access_token);
localStorage.setItem("full_name", data.full_name || "");
localStorage.setItem("role", String(data.role || role).toUpperCase());


      if (remember) {
        localStorage.setItem("remember_me", "true");
      } else {
        localStorage.removeItem("remember_me");
      }

      setSuccess(`Welcome back, ${data.full_name || "User"}!`);

      setTimeout(() => {
        onSuccess(data);
      }, 600);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <InputField
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<MailIcon />}
        autoComplete="email"
      />

      <InputField
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<LockIcon />}
        autoComplete="current-password"
      />

      <div className="login-options">
        <label className="remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>Remember me</span>
        </label>

        <a href="#forgot" onClick={(e) => e.preventDefault()}>
          Forgot password?
        </a>
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
