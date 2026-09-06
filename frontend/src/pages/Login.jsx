import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/common/Modal";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthModal, setOauthModal] = useState({ isOpen: false, provider: "" });
  const [forgotModal, setForgotModal] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      if (user && user.profileComplete) {
        navigate("/home", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialClick = (provider) => {
    setOauthModal({ isOpen: true, provider });
  };

  return (
    <div className="nl-auth">
      {/* Header with circular icon */}
      <div className="nl-auth__header">
        <div className="nl-auth__icon">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <h1 className="nl-auth__title">Welcome to NutriLens</h1>
        <p className="nl-auth__subtitle">Scan smarter, eat better.</p>
      </div>

      {/* Login Form */}
      <form className="nl-auth__form" onSubmit={handleSubmit}>
        {error && <div className="nl-auth-error">{error}</div>}

        {/* Email or Phone */}
        <div className="nl-field">
          <label className="nl-field__label">Email or Phone</label>
          <div className="nl-field__input-wrap nl-field__input-wrap--has-icon">
            <svg
              className="nl-field__icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className="nl-input"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Password with Eye Toggle */}
        <div className="nl-field">
          <label className="nl-field__label">Password</label>
          <div className="nl-field__input-wrap nl-field__input-wrap--has-toggle">
            <input
              type={showPassword ? "text" : "password"}
              className="nl-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="nl-field__toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="nl-btn-submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging In..." : "Log In"}
        </button>

        {/* Forgot Password */}
        <div className="nl-auth__forgot">
          <button
            type="button"
            onClick={() => setForgotModal(true)}
            className="nl-link-teal"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            Forgot Password?
          </button>
        </div>

        {/* Divider */}
        <div className="nl-divider">
          <span>or continue with</span>
        </div>

        {/* Social Buttons */}
        <div className="nl-social-row">
          <button
            type="button"
            className="nl-btn-social"
            onClick={() => handleSocialClick("Google")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            className="nl-btn-social"
            onClick={() => handleSocialClick("Apple")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <span>Apple</span>
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="nl-auth__footer">
          <span>Don't have an account? </span>
          <Link to="/signup">Sign Up</Link>
        </div>
      </form>

      {/* OAuth Configuration Notice Modal */}
      <Modal
        isOpen={oauthModal.isOpen}
        onClose={() => setOauthModal({ isOpen: false, provider: "" })}
        title={`${oauthModal.provider} Authentication`}
        footer={
          <button
            type="button"
            className="nl-btn-submit"
            onClick={() => setOauthModal({ isOpen: false, provider: "" })}
          >
            Understood
          </button>
        }
      >
        <div
          style={{
            fontSize: "0.92rem",
            lineHeight: "1.5",
            color: "var(--nl-text-sub)",
          }}
        >
          <p style={{ marginBottom: "12px" }}>
            <strong>{oauthModal.provider} Sign-In</strong> is not configured
            yet.
          </p>
          <div className="nl-disclaimer-box" style={{ margin: "0 0 12px" }}>
            To enable {oauthModal.provider} authentication in production, add
            your OAuth Client Credentials in the environment configuration.
          </div>
          <p>
            Please use your <strong>Email and Password</strong> to log in.
          </p>
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModal}
        onClose={() => setForgotModal(false)}
        title="Reset Password"
        footer={
          <button
            type="button"
            className="nl-btn-submit"
            onClick={() => setForgotModal(false)}
          >
            Close
          </button>
        }
      >
        <div
          style={{
            fontSize: "0.92rem",
            lineHeight: "1.5",
            color: "var(--nl-text-sub)",
          }}
        >
          <p style={{ marginBottom: "12px" }}>
            Enter your email to receive a password reset link:
          </p>
          <input
            type="email"
            className="nl-input"
            placeholder="you@email.com"
            defaultValue={email}
            style={{ marginBottom: "14px" }}
          />
          <p style={{ fontSize: "0.82rem", color: "var(--nl-text-muted)" }}>
            If an account with this email exists, password reset instructions
            will be sent.
          </p>
        </div>
      </Modal>
    </div>
  );
}
