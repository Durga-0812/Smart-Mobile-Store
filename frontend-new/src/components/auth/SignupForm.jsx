
import React, { useState } from "react";
import InputField from "../common/InputField";
import { MailIcon, LockIcon } from "../common/Icons";

export default function SignupForm({ onSuccess }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }

    if (!lastName.trim()) {
      setError("Please enter your last name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!terms) {
      setError("Please agree to the Terms & Conditions.");
      return;
    }

    try {
      setLoading(true);

      
const response = await fetch(
  "https://smart-mobile-store.onrender.com/api/v1/auth/signup",
  {


          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            phone: null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail?.[0]?.msg ||
            data.detail ||
            "Signup failed."
        );
      }

      setSuccess(
        "Account created successfully! You can log in now."
      );

      setTimeout(() => {
        onSuccess(data);
      }, 800);
    } catch (err) {
      setError(
        err.message || "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="name-row">
        <InputField
          label="First Name"
          type="text"
          placeholder="John"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />

        <InputField
          label="Last Name"
          type="text"
          placeholder="Doe"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>

      <InputField
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<MailIcon />}
        required
        autoComplete="email"
      />

      <InputField
        label="Password"
        type="password"
        placeholder="Create a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<LockIcon />}
        required
        autoComplete="new-password"
      />

      <label className="terms-row">
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
        />

        <span>
          I agree to the{" "}
          <a
            href="#terms"
            onClick={(e) => e.preventDefault()}
          >
            Terms & Conditions
          </a>
        </span>
      </label>

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      {success && (
        <div className="message success">
          {success}
        </div>
      )}

      <button
        type="submit"
        className="submit-button"
        disabled={loading}
      >
        {loading ? "Creating Account..." : "Create Account"}
      </button>
    </form>
  );
}

