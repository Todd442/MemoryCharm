import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { AuthGuard } from "./auth/AuthGuard";
import { CharmEntryPage } from "../features/playback/pages/CharmEntryPage";
import { PlaybackShell } from "../features/playback/shell/PlaybackShell";
import { ClaimCharmPage } from "../features/claim/pages/ClaimCharmPage";
import { LandingPage } from "../features/home/pages/LandingPage";
import { AccountPage } from "../features/account/pages/AccountPage";
import { CharmDetailPage } from "../features/account/pages/CharmDetailPage";
import { PurchasePage } from "../features/account/pages/PurchasePage";
import { RequireAuth } from "../app/auth/RequireAuth";
import { RequireUla } from "../app/auth/RequireUla";
import { ScrollTestPage } from "../features/test/pages/ScrollTestPage.tsx";
import { NfcCheckPage } from "../features/nfc-check/pages/NfcCheckPage";
import { TermsPage } from "../features/legal/pages/TermsPage";
import { PlainTermsPage } from "../features/legal/pages/PlainTermsPage";
import { TermsAcceptPage } from "../features/legal/pages/TermsAcceptPage";
import { NotFoundPage } from "../features/home/pages/NotFoundPage";
import { StatusProvider } from "../app/providers/StatusProvider";


export const router = createBrowserRouter([
  // Landing page — full-viewport, no shell frame
  {
    path: "/",
    element: (
      <AuthGuard>
        <LandingPage />
      </AuthGuard>
    ),
  },

  // Legal pages — standalone, no shell
  { path: "/terms", element: <TermsPage /> },
  { path: "/terms/plain", element: <PlainTermsPage /> },
  { path: "/terms/accept", element: <TermsAcceptPage /> },

  // NFC check — standalone, no shell (public, recipient-facing)
  { path: "/nfc-check", element: <StatusProvider><NfcCheckPage /></StatusProvider> },

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
      // Account (protected)
      {
        path: "/account",
        element: (
          <RequireAuth>
            <RequireUla>
              <AccountPage />
            </RequireUla>
          </RequireAuth>
        ),
      },
      {
        path: "/account/charms/:code",
        element: (
          <RequireAuth>
            <RequireUla>
              <CharmDetailPage />
            </RequireUla>
          </RequireAuth>
        ),
      },
      {
        path: "/account/charms/:code/purchase",
        element: (
          <RequireAuth>
            <RequireUla>
              <PurchasePage />
            </RequireUla>
          </RequireAuth>
        ),
      },

      // Claim flow (protected)
      {
        path: "/claim/:code",
        element: (
          <RequireAuth>
            <RequireUla>
              <ClaimCharmPage />
            </RequireUla>
          </RequireAuth>
        ),
      },
      { path: "/test/scroll", element: <ScrollTestPage /> },
    ],
  },

  // Catch-all — standalone branded 404 page (no shell)
  { path: "*", element: <NotFoundPage /> },
]);
