import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register(email, password, fullName);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err.message || "Sign up failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="nl-auth">
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
        <h1 className="nl-auth__title">Create Account</h1>
        <p className="nl-auth__subtitle">Join NutriLens to eat smarter.</p>
      </div>

      <form className="nl-auth__form" onSubmit={handleSubmit}>
        {error && <div className="nl-auth-error">{error}</div>}

        <div className="nl-field">
          <label className="nl-field__label">Full Name</label>
          <input
            type="text"
            className="nl-input"
            placeholder="e.g. Priya Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="nl-field">
          <label className="nl-field__label">Email Address</label>
          <input
            type="email"
            className="nl-input"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="nl-field">
          <label className="nl-field__label">Password</label>
          <input
            type="password"
            className="nl-input"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <button type="submit" className="nl-btn-submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Continue"}
        </button>

        <div className="nl-auth__footer">
          <span>Already have an account? </span>
          <Link to="/login">Log In</Link>
        </div>
      </form>
    </div>
  );
}
