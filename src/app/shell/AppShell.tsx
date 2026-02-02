import React from "react";
import { Outlet } from "react-router-dom";
import { StatusBar } from "./StatusBar";
import { FrameLayers } from "./FrameLayers";

export function AppShell() {
  return (
    <div className="te-root">
      <FrameLayers />

      <div className="te-content">
        <StatusBar />
        <main className="te-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
