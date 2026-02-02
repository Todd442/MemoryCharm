import React from "react";
import { createBrowserRouter, Link } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { CharmEntryPage } from "../features/playback/pages/CharmEntryPage";
import { ClaimCharmPage } from "../features/claim/pages/ClaimCharmPage";

function Home() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 24 }}>Home</div>
      <p><Link to="/c?token=t:OPEN">Test OPEN</Link></p>
      <p><Link to="/c?token=t:GLYPH">Test GLYPH</Link></p>
      <p><Link to="/c?token=t:UNCLAIMED">Test UNCLAIMED</Link></p>
      <p><Link to="/c?token=t:EXPIRED">Test EXPIRED</Link></p>
      <p><Link to="/c?token=t:MISSING">Test MISSING</Link></p>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 24 }}>404</div>
      <div style={{ marginTop: 12 }}>That page doesn’t exist.</div>
      <p style={{ marginTop: 12 }}><Link to="/">Go Home</Link></p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Home /> },

      // NFC bootstrap + clean URL
      { path: "/c", element: <CharmEntryPage /> },
      { path: "/c/:code", element: <CharmEntryPage /> },

      // Claim flow (THIS is what UNCLAIMED redirects to)
      { path: "/claim/:code", element: <ClaimCharmPage /> },

      // Friendly catch-all
      { path: "*", element: <NotFound /> },
    ],
  },
]);
