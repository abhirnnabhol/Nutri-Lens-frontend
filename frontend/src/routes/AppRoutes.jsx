import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";

// Pages
import Splash from "../pages/Splash";
import Login from "../pages/Login";
import SignUp from "../pages/SignUp";
import Onboarding from "../pages/Onboarding";
import Home from "../pages/Home";
import Search from "../pages/Search";
import Scanner from "../pages/Scanner";
import History from "../pages/History";
import Profile from "../pages/Profile";
import ProductDetail from "../pages/ProductDetail";
import Compare from "../pages/Compare";

/**
 * Route path constants for type-safe and consistent navigation.
 */
export const ROUTES = {
  SPLASH: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  ONBOARDING: "/onboarding",
  HOME: "/home",
  SEARCH: "/search",
  SCAN: "/scan",
  HISTORY: "/history",
  PROFILE: "/profile",
  COMPARE: "/compare",
  PRODUCT_DETAIL: "/product/:id",
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Splash Screen (Mockup 1) */}
      <Route path={ROUTES.SPLASH} element={<Splash />} />

      {/* 2. Authentication (Mockup 2) */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.SIGNUP} element={<SignUp />} />

      {/* 3. Onboarding Wizard (Mockup 3) */}
      <Route
        path={ROUTES.ONBOARDING}
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* 4. App Shell with 5-Tab Bottom Navigation (Mockups 4 & 5) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.SEARCH} element={<Search />} />
        <Route path={ROUTES.SCAN} element={<Scanner />} />
        <Route path={ROUTES.HISTORY} element={<History />} />
        <Route path={ROUTES.PROFILE} element={<Profile />} />
        <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetail />} />
        <Route path={ROUTES.COMPARE} element={<Compare />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
