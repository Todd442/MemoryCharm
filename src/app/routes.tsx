import React from "react";
import { createBrowserRouter, Link } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { CharmEntryPage } from "../features/playback/pages/CharmEntryPage";
import { ClaimCharmPage } from "../features/claim/pages/ClaimCharmPage";

function Home() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 24 }}>Home</div>

      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        <div style={{ opacity: 0.8 }}>NFC entry (query token):</div>
        <Link to="/c?Token=t:OPEN">Test OPEN</Link>
        <Link to="/c?Token=t:GLYPH">Test GLYPH</Link>
        <Link to="/c?Token=t:UNCLAIMED">Test UNCLAIMED</Link>
        <Link to="/c?Token=t:EXPIRED">Test EXPIRED</Link>
        <Link to="/c?Token=t:MISSING">Test MISSING</Link>

        <div style={{ marginTop: 10, opacity: 0.7 }}>Clean URLs (no token):</div>
        <Link to="/c/OPEN">/c/OPEN</Link>
        <Link to="/c/GLYPH">/c/GLYPH</Link>
        <Link to="/c/UNCLAIMED">/c/UNCLAIMED</Link>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 24 }}>404</div>
      <div style={{ marginTop: 12 }}>That page doesn’t exist.</div>
      <p style={{ marginTop: 12 }}>
        <Link to="/">Go Home</Link>
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Home /> },

      // NFC bootstrap: /c?Token=...
      { path: "/c", element: <CharmEntryPage /> },

      // Clean URL: /c/:code
      { path: "/c/:code", element: <CharmEntryPage /> },

      // Claim flow
      { path: "/claim/:code", element: <ClaimCharmPage /> },

      { path: "*", element: <NotFound /> },
    ],
  },
]);
