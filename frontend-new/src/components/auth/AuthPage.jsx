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
  loginRole,
  setLoginRole,
  onClose,
  onLoginSuccess,
}) {
  const isSignup = mode === "signup";

  return (
    <main className="page">
      <section className="auth-card">
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
            onClick={onClose}
            aria-label="Back to homepage"
          >
            <BackArrowIcon />
          </button>

          <div className="heading-area">
            <h1>
              {isSignup
                ? "Create an Account"
                : loginRole === "ADMIN"
                  ? "Admin Login"
                  : "Welcome Back"}
            </h1>

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
          </div>

          {isSignup ? (
            <SignupForm onSuccess={() => setMode("login")} />
          ) : (
            <LoginForm
              role={loginRole}
              onSuccess={onLoginSuccess}
            />
          )}

          {loginRole === "USER" && !isSignup && (
            <>
              <div className="divider">
                <span />
                <p>or</p>
                <span />
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
            </>
          )}
        </div>
      </section>
    </main>
  );
}