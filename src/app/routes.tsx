import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { CharmEntryPage } from "../features/playback/pages/CharmEntryPage";
import { ClaimCharmPage } from "../features/claim/pages/ClaimCharmPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      // NFC bootstrap: /c?token=...
      // Clean URL:     /c/:code
      { path: "/c", element: <CharmEntryPage /> },
      { path: "/c/:code", element: <CharmEntryPage /> },

      { path: "/claim/:code", element: <ClaimCharmPage /> },

      // Optional: home
      { path: "/", element: <div style={{ padding: 24 }}>Home</div> },
    ],
  },
]);
