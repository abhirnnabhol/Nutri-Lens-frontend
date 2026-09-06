import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimerDone(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const proceed = () => {
    if (loading) return;
    if (user) {
      if (user.profileComplete) {
        navigate("/home", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    if (timerDone && !loading) {
      proceed();
    }
  }, [timerDone, loading, user]);

  return (
    <div
      className="nl-splash"
      onClick={proceed}
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
    >
      <div className="nl-splash__icon">
        <svg
          width="40"
          height="40"
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
      <h1 className="nl-splash__title">NutriLens</h1>
      <p className="nl-splash__subtitle">Scan smarter, eat better</p>
    </div>
  );
}
