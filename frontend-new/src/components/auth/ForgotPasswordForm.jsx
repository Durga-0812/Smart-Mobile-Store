import React, { useState } from "react";

const API_URL =
  "http://127.0.0.1:8000/api/v1/auth";

export default function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState("email");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to send OTP.");
      }

      setStep("reset");
      setSuccess(
        "If your email is registered, an OTP has been sent. Check your Gmail."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Password must contain 8 to 72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp,
          new_password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Password reset failed.");
      }

      setStep("done");
      setSuccess(data.message || "Password reset successful.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {step === "email" && (
        <form className="auth-form" onSubmit={sendOTP}>
          <div className="field">
            <label>Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                placeholder="Enter your registered Gmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="message error">{error}</div>}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

          <button
            type="button"
            className="forgot-back-button"
            onClick={onBack}
          >
            Back to Login
          </button>
        </form>
      )}

      {step === "reset" && (
        <form className="auth-form" onSubmit={resetPassword}>
          {success && <div className="message success">{success}</div>}

          <div className="field">
            <label>OTP</label>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>
          </div>

          <div className="field">
            <label>New Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Confirm New Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="message error">{error}</div>}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="auth-form">
          <div className="message success">{success}</div>

          <button
            type="button"
            className="submit-button"
            onClick={onBack}
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
}
