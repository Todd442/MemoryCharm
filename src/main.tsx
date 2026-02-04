import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";

import { router } from "./app/routes";
import { msalInstance } from "./app/auth/msalInstance";

import "./styles/base.css";
import "./styles/tokens.css";
import "./styles/frame.css";
import "./styles/panel.css";

const RETURN_TO_KEY = "mc.returnTo";

async function bootstrap() {
  // IMPORTANT: Initialize MSAL and process the redirect response *before* rendering routes.
  await msalInstance.initialize();

  const result = await msalInstance.handleRedirectPromise();

  // If we came back from login, MSAL gives us the account here.
  if (result?.account) {
    msalInstance.setActiveAccount(result.account);

    // ✅ Restore the page that required auth (e.g. /claim/UNCLAIMED)
    const returnTo = sessionStorage.getItem(RETURN_TO_KEY) || localStorage.getItem(RETURN_TO_KEY);
    if (returnTo) {
      sessionStorage.removeItem(RETURN_TO_KEY);
      localStorage.removeItem(RETURN_TO_KEY);
      window.history.replaceState(null, "", returnTo);
    }
  } else {
    // Otherwise, restore an existing cached account if present.
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
    
    // FALLBACK: If MSAL didn't complete the redirect but we have a stored returnTo and the URL has auth markers,
    // restore the returnTo path anyway (workaround for MSAL redirect handling issues with hash-based auth responses)
    const returnTo = sessionStorage.getItem(RETURN_TO_KEY) || localStorage.getItem(RETURN_TO_KEY);
    const hasAuthMarkers = window.location.search.includes("code") || 
                           window.location.search.includes("session_state") ||
                           window.location.hash.includes("code") || 
                           window.location.hash.includes("session_state");
    if (returnTo && hasAuthMarkers) {
      sessionStorage.removeItem(RETURN_TO_KEY);
      localStorage.removeItem(RETURN_TO_KEY);
      window.history.replaceState(null, "", returnTo);
      window.location.reload();
    }
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <RouterProvider router={router} />
      </MsalProvider>
    </React.StrictMode>
  );
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
