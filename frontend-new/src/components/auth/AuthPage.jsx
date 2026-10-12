import React from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import {
  BackArrowIcon,
  GoogleIcon,
  FacebookIcon,
  LogoMark,
} from "../common/Icons";
import "./AuthPage.css";

export default function AuthPage({
  mode,
  setMode,
  onClose,
  onLoginSuccess,
}) {
  const isSignup = mode === "signup";

  return (
    <main className="page">
      <section className="auth-card">
        {/* LEFT IMAGE PANEL */}
        <div className="image-panel">
          <div className="image-overlay">
            <div className="logo-mark">
              <LogoMark />
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="form-panel">
          <button
            type="button"
            className="back-button"
            onClick={onClose}
            aria-label="Back to homepage"
          >
            <BackArrowIcon />
          </button>

          <div className="heading-area">
            <h1>{isSignup ? "Create an Account" : "Welcome Back"}</h1>

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
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="switch-link"
                    onClick={() => setMode("signup")}
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>

          {isSignup ? (
            <SignupForm onSuccess={() => setMode("login")} />
          ) : (
            <LoginForm onSuccess={onLoginSuccess} />
          )}

          {/* SOCIAL LOGIN */}
          <div className="divider">
            <span></span>
            <p>or</p>
            <span></span>
          </div>

          <div className="social-row">
            <button type="button" className="social-button">
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <button type="button" className="social-button">
              <FacebookIcon />
              <span>Continue with Facebook</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
