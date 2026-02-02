import React from "react";
import { Outlet, Link } from "react-router-dom";

export function AppShell() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <strong>Shell:</strong>{" "}
        <Link to="/">Home</Link>{" "}
        | <Link to="/c?token=abc123">C (token)</Link>{" "}
        | <Link to="/c/OPEN">C (code)</Link>
      </div>

      <div style={{ border: "1px solid #ccc", padding: 16 }}>
        <Outlet />
      </div>
    </div>
  );
}
