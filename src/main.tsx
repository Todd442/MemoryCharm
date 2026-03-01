import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";

import { router } from "./app/routes";
import { msalInstance } from "./app/auth/msalInstance";
import { debugLog } from "./app/auth/debugLog";

import "./styles/base.css";
import "./styles/tokens.css";
import "./styles/frame.css";
import "./styles/panel.css";

async function bootstrap() {
  // IMPORTANT: Initialize MSAL and process the redirect response *before* rendering.
  debugLog("bootstrap", `Starting. URL: ${window.location.href}`);
  debugLog("bootstrap", `Search: ${window.location.search}, Hash: ${window.location.hash}`);
  
  await msalInstance.initialize();
  debugLog("bootstrap", "MSAL initialized");
  
  const redirectResult = await msalInstance.handleRedirectPromise();
  debugLog("bootstrap", `handleRedirectPromise result: ${redirectResult ? "SUCCESS" : "null"}`);
  if (redirectResult) {
    debugLog("bootstrap", `Auth result: accessToken=${redirectResult.accessToken ? "yes" : "no"}, uniqueId=${redirectResult.uniqueId}`);
    // Persist the account so getActiveAccount() works for the session lifetime.
    // handleRedirectPromise stores tokens but does NOT set an active account.
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
      debugLog("bootstrap", `Active account set: ${accounts[0].username}`);
    }
  }
  
  const allAccounts = msalInstance.getAllAccounts();
  debugLog("bootstrap", `After redirect: allAccounts.length=${allAccounts.length}`);
  if (allAccounts.length > 0) {
    debugLog("bootstrap", `First account username: ${allAccounts[0].username}`);
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <RouterProvider router={router} />
      </MsalProvider>
    </React.StrictMode>
  );
}

// Register service worker for PWA installability (requires HTTPS).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {/* non-fatal */});
  });
}

bootstrap().catch((err) => {
  console.error("MSAL bootstrap failed", err);
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <div style={{ padding: 24 }}>
      <h2>Startup error</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>{String(err)}</pre>
    </div>
  );
});
