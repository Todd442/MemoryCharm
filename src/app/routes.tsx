import React from "react";
import { createBrowserRouter, Link } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { CharmEntryPage } from "../features/playback/pages/CharmEntryPage";


function Home() {
  return (
    <div>
      <div style={{ fontSize: 24 }}>Home</div>
      <p><Link to="/c?token=abc123">Go to /c?token=abc123</Link></p>
      <p><Link to="/c/OPEN">Go to /c/OPEN</Link></p>
    </div>
  );
}

import { useLocation, useParams } from "react-router-dom";

function CPage() {
  const { code } = useParams<{ code?: string }>();
  const { search } = useLocation();
  const qs = new URLSearchParams(search);
  const token = qs.get("token");

  return (
    <div style={{ fontSize: 18 }}>
      <div style={{ fontSize: 24, marginBottom: 10 }}>C Page</div>
      <div><strong>code:</strong> {code ?? "(none)"}</div>
      <div><strong>token:</strong> {token ?? "(none)"}</div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/c", element: <CharmEntryPage /> },
      { path: "/c/:code", element: <CharmEntryPage /> },
    ],
  },
]);
