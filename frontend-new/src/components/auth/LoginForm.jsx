import React, { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import InputField from "../common/InputField";
import { MailIcon, LockIcon } from "../common/Icons";

export default function LoginForm({
  onSuccess,
  onForgotPassword,
  role = "USER",
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

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

    if (!captchaToken) {
      setError("Please verify that you are not a robot.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
          recaptcha_token: captchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to login.");
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("full_name", data.full_name || "");
      localStorage.setItem(
        "role",
        String(data.role || role).toUpperCase()
      );

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
      setError(err.message || "Login failed.");
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <InputField
        label="Email Address"
        type="email"
        name="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<MailIcon />}
        required
      />

      <InputField
        label="Password"
        type="password"
        name="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<LockIcon />}
        required
      />

      {/* Smaller Google reCAPTCHA */}
      <div
        style={{
          margin: "12px 0",
          height: "65px",
          overflow: "hidden",
        }}
      >
        {recaptchaSiteKey ? (
          <div
            style={{
              transform: "scale(0.8)",
              transformOrigin: "top left",
              width: "304px",
            }}
          >
            <ReCAPTCHA
              sitekey={recaptchaSiteKey}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
            />
          </div>
        ) : (
          <p style={{ color: "red" }}>
            CAPTCHA site key is missing.
          </p>
        )}
      </div>

      <div className="login-options">
        <label className="remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>Remember me</span>
        </label>

        <button
          type="button"
          className="forgot-link"
          onClick={onForgotPassword}
        >
          Forgot password?
        </button>
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <button
        type="submit"
        className="submit-button"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}