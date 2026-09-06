import React from "react";
import { NavLink } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav className="nl-bottom-nav">
      {/* 1. Home */}
      <NavLink
        to="/home"
        className={({ isActive }) =>
          `nl-nav-item ${isActive ? "nl-nav-item--active" : ""}`
        }
      >
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
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Home</span>
      </NavLink>

      {/* 2. Search */}
      <NavLink
        to="/search"
        className={({ isActive }) =>
          `nl-nav-item ${isActive ? "nl-nav-item--active" : ""}`
        }
      >
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
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span>Search</span>
      </NavLink>

      {/* 3. Scan FAB (Center) */}
      <NavLink to="/scan" className="nl-nav-item nl-nav-item--scan">
        <div className="nl-scan-fab">
          <svg
            width="26"
            height="26"
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
        <span>Scan</span>
      </NavLink>

      {/* 4. History */}
      <NavLink
        to="/history"
        className={({ isActive }) =>
          `nl-nav-item ${isActive ? "nl-nav-item--active" : ""}`
        }
      >
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
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>History</span>
      </NavLink>

      {/* 5. Profile */}
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `nl-nav-item ${isActive ? "nl-nav-item--active" : ""}`
        }
      >
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
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
