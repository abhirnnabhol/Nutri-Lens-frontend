import React from "react";
import { Link, NavLink } from "react-router-dom";

export default function Header({ apiConnected = true }) {
  return (
    <header className="nl-header">
      <div className="nl-header__container">
        <Link to="/" className="nl-logo">
          <div className="nl-logo__icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <div className="nl-logo__text">
            <span className="nl-logo__title">NutriLens</span>
            <span className="nl-logo__tagline">Food Comparison</span>
          </div>
        </Link>

        <nav className="nl-nav">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nl-nav__link ${isActive ? "nl-nav__link--active" : ""}`
            }
          >
            Home
          </NavLink>
        </nav>

        <div className="nl-header__status">
          <span
            className={`nl-status-pill ${
              apiConnected
                ? "nl-status-pill--online"
                : "nl-status-pill--offline"
            }`}
            title={apiConnected ? "API Connected" : "API Connecting / Offline"}
          >
            <span className="nl-status-dot" />
            {apiConnected ? "API Connected" : "API Disconnected"}
          </span>
        </div>
      </div>
    </header>
  );
}
