import React from "react";
import { createBrowserRouter, Link } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { AuthGuard } from "./auth/AuthGuard";
import { CharmEntryPage } from "../features/playback/pages/CharmEntryPage";
import { PlaybackShell } from "../features/playback/shell/PlaybackShell";
import { ClaimCharmPage } from "../features/claim/pages/ClaimCharmPage";
import { HomePage } from "../features/home/pages/HomePage";
import { AccountPage } from "../features/account/pages/AccountPage";
import { CharmDetailPage } from "../features/account/pages/CharmDetailPage";
import { PurchasePage } from "../features/account/pages/PurchasePage";
import { RequireAuth } from "../app/auth/RequireAuth";
import { ScrollTestPage } from "../features/test/pages/ScrollTestPage.tsx";
import { NfcCheckPage } from "../features/nfc-check/pages/NfcCheckPage";

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: "var(--fs-section)" }}>404</div>
      <div style={{ marginTop: 12 }}>That page doesn't exist.</div>
      <p style={{ marginTop: 12 }}>
        <Link to="/">Go Home</Link>
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  // Playback routes — immersive nebula shell, no frame
  {
    element: (
      <AuthGuard>
        <PlaybackShell />
      </AuthGuard>
    ),
    children: [
      // NFC bootstrap: /c?Token=...
      { path: "/c", element: <CharmEntryPage /> },
      // Clean URL: /c/:code
      { path: "/c/:code", element: <CharmEntryPage /> },
    ],
  },

  // App routes — ornamental frame shell
  {
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { path: "/", element: <HomePage /> },

      // Account (protected)
      {
        path: "/account",
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },
      {
        path: "/account/charms/:code",
        element: (
          <RequireAuth>
            <CharmDetailPage />
          </RequireAuth>
        ),
      },
      {
        path: "/account/charms/:code/purchase",
        element: (
          <RequireAuth>
            <PurchasePage />
          </RequireAuth>
        ),
      },

      // Claim flow (protected)
      {
        path: "/claim/:code",
        element: (
          <RequireAuth>
            <ClaimCharmPage />
          </RequireAuth>
        ),
      },
      // NFC Check & Guide (public)
      { path: "/nfc-check", element: <NfcCheckPage /> },

      { path: "/test/scroll", element: <ScrollTestPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
