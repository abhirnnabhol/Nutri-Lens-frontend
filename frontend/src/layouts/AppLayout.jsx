import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "../components/common/BottomNav";
import ComparisonTray from "../components/common/ComparisonTray";

export default function AppLayout() {
  return (
    <div className="nl-app-shell">
      <main className="nl-app-main">
        <Outlet />
      </main>
      <ComparisonTray />
      <BottomNav />
    </div>
  );
}
