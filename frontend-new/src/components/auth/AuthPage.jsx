import React, { useState, useEffect, useRef } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import ForgotPasswordForm from "./ForgotPasswordForm";

import {
  BackArrowIcon,
  LogoMark,
} from "../common/Icons";

import "./AuthPage.css";

export default function AuthPage({
  mode,
  setMode,
  loginRole,
  setLoginRole,
  onClose,
  onLoginSuccess,
}) {
  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleButtonRef = useRef(null);

  const isSignup = mode === "signup";

  // Load Google authentication script
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGoogleReady(true);
      return;
    }

    const script = document.createElement("script");

    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => setGoogleReady(true);

    script.onerror = () => {
      setGoogleError("Unable to load Google Sign-In.");
    };

    document.head.appendChild(script);
  }, []);

  // Display Google's official sign-in button
  useEffect(() => {
    if (
      !googleReady ||
      isSignup ||
      loginRole !== "USER" ||
      showForgotPassword ||
      !googleButtonRef.current
    ) {
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setGoogleError("Google Client ID is missing.");
      return;
    }

    googleButtonRef.current.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: clientId,

      callback: async (response) => {
        try {
          setGoogleLoading(true);
          setGoogleError("");

          const result = await fetch("/api/v1/auth/google", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              credential: response.credential,
            }),
          });

          const data = await result.json();

          if (!result.ok) {
            throw new Error(
              data.detail || "Google login failed."
            );
          }

          localStorage.setItem(
            "access_token",
            data.access_token
          );

          localStorage.setItem(
            "full_name",
            data.full_name || ""
          );

          localStorage.setItem(
            "role",
            data.role
          );

          onLoginSuccess(data);

        } catch (error) {
          setGoogleError(error.message);
        } finally {
          setGoogleLoading(false);
        }
      },
    });

    window.google.accounts.id.renderButton(
  googleButtonRef.current,
  {
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rect",
    width: 350,
  }
);

  }, [
    googleReady,
    isSignup,
    loginRole,
    showForgotPassword,
    onLoginSuccess,
  ]);

  const goToLogin = () => {
    setShowForgotPassword(false);
    setMode("login");
  };

  return (
    <main
      className="page auth-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="auth-card"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="image-panel">
          <div className="image-overlay">
            <div className="logo-mark">
              <LogoMark />
            </div>
          </div>
        </div>

        <div className="form-panel">

          <button
            type="button"
            className="back-button"
            onClick={
              showForgotPassword ? goToLogin : onClose
            }
            aria-label="Back"
          >
            <BackArrowIcon />
          </button>

          <div className="heading-area">

            <h1>
              {showForgotPassword
                ? "Forgot Password"
                : isSignup
                  ? "Create an Account"
                  : loginRole === "ADMIN"
                    ? "Admin Login"
                    : "Welcome Back"}
            </h1>

            {showForgotPassword ? (
              <p>
                Enter your registered email to receive a password reset OTP.
              </p>
            ) : (
              <>
                {!isSignup && (
                  <div className="login-role-options">

                    <button
                      type="button"
                      className={loginRole === "USER" ? "active" : ""}
                      onClick={() => setLoginRole("USER")}
                    >
                      User Login
                    </button>

                    <button
                      type="button"
                      className={loginRole === "ADMIN" ? "active" : ""}
                      onClick={() => setLoginRole("ADMIN")}
                    >
                      Admin Login
                    </button>

                  </div>
                )}

                <p>
                  {isSignup ? (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="switch-link"
                        onClick={() => setMode("login")}
                      >
                        Log in
                      </button>
                    </>
                  ) : (
                    <>
                      {loginRole === "ADMIN"
                        ? "Sign in with your administrator account."
                        : "Don't have an account? "}

                      {loginRole === "USER" && (
                        <button
                          type="button"
                          className="switch-link"
                          onClick={() => setMode("signup")}
                        >
                          Sign up
                        </button>
                      )}
                    </>
                  )}
                </p>
              </>
            )}

          </div>

          {showForgotPassword ? (
            <ForgotPasswordForm onBack={goToLogin} />
          ) : isSignup ? (
            <SignupForm onSuccess={() => setMode("login")} />
          ) : (
            <LoginForm
              role={loginRole}
              onSuccess={onLoginSuccess}
              onForgotPassword={() =>
                setShowForgotPassword(true)
              }
            />
          )}

          {!showForgotPassword &&
            loginRole === "USER" &&
            !isSignup && (
              <>
                <div className="divider">
                  <span />
                  <p>or</p>
                  <span />
                </div>

                <div className="social-row">
                  <div
                    ref={googleButtonRef}
                    className="google-button-container"
                  />
                </div>

                {googleLoading && (
                  <p>Signing in with Google...</p>
                )}

                {googleError && (
                  <p style={{ color: "red" }}>
                    {googleError}
                  </p>
                )}

              </>
            )}

        </div>
      </section>
    </main>
  );
}