import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";

import { router } from "./app/routes";
import { msalInstance } from "./app/auth/msalInstance";
import { msalConfig } from "./app/auth/msalConfig";
import { debugLog } from "./app/auth/debugLog";

import "./styles/base.css";
import "./styles/tokens.css";
import "./styles/frame.css";
import "./styles/panel.css";

async function bootstrap() {
  // IMPORTANT: Initialize MSAL and process the redirect response *before* rendering.
  debugLog("bootstrap", `Starting. URL: ${window.location.href}`);
  debugLog("bootstrap", `Search: ${window.location.search}, Hash: ${window.location.hash}`);

  // Detect a failed MSAL redirect response (e.g. AADSTS50058 from a silent
  // token renewal attempt). The hash will contain both `error=` and `state=`.
  // handleRedirectPromise() returns null for interactionType:silent errors, so
  // the stale account stays cached and the page loops indefinitely.
  // Fix: clear all MSAL storage and reload clean to force an interactive login.
  const hash = window.location.hash;
  const isMsalErrorHash = hash.includes("error=") && hash.includes("state=");
  if (isMsalErrorHash) {
    debugLog("bootstrap", `Auth error in hash — clearing MSAL state and reloading: ${hash}`);
    const clientId = msalConfig.auth.clientId;
    const clearStore = (store: Storage) =>
      Object.keys(store)
        .filter(k => k.includes(clientId) || k.toLowerCase().includes("msal"))
        .forEach(k => store.removeItem(k));
    clearStore(sessionStorage);
    clearStore(localStorage);
    window.location.replace(window.location.origin + window.location.pathname);
    return;
  }

  await msalInstance.initialize();
  debugLog("bootstrap", "MSAL initialized");

  // If an auth code is in the URL but MSAL's interaction flag was lost (common
  // intermittent issue — see MEMORY.md), handleRedirectPromise returns null and
  // leaves a stale interaction lock that causes subsequent acquireTokenSilent
  // calls to TIMED_OUT.  Clear any MSAL session-storage state and reload without
  // the hash so MSAL can start a clean redirect from scratch.
  const hasAuthCode =
    window.location.hash.includes("code=") ||
    window.location.search.includes("code=");
  if (hasAuthCode) {
    // Attempt to process the code first — only clear+reload if MSAL can't handle it.
    const preCheck = await msalInstance.handleRedirectPromise().catch(() => null);
    debugLog("bootstrap", `pre-check handleRedirectPromise: ${preCheck ? "SUCCESS" : "null"}`);
    if (!preCheck) {
      debugLog("bootstrap", "Auth code present but unprocessable — clearing stale MSAL session state and reloading");
      Object.keys(sessionStorage)
        .filter(k => k.includes(msalConfig.auth.clientId) || k.toLowerCase().includes("msal"))
        .forEach(k => sessionStorage.removeItem(k));
      window.location.replace(window.location.origin + window.location.pathname);
      return; // stop — page will reload and re-enter bootstrap without the code
    }
    // preCheck succeeded — skip the second handleRedirectPromise call below
    debugLog("bootstrap", `handleRedirectPromise result: SUCCESS (pre-check)`);
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) msalInstance.setActiveAccount(accounts[0]);
    const allAccountsEarly = msalInstance.getAllAccounts();
    debugLog("bootstrap", `After redirect: allAccounts.length=${allAccountsEarly.length}`);
    if (allAccountsEarly.length > 0) debugLog("bootstrap", `First account username: ${allAccountsEarly[0].username}`);
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <RouterProvider router={router} />
        </MsalProvider>
      </React.StrictMode>
    );
    return;
  }

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
