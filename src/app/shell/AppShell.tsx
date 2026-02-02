import React from "react";
import { Outlet, Link } from "react-router-dom";
import { FixedStage } from "./FixedStage";

export function AppShell() {
  return (
     <FixedStage width={900} height={1600} fit="contain" background="#0b0a08">

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
    </FixedStage  >
  );
}
