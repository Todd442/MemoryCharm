import React, { useEffect, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useLocation } from "react-router-dom";
import { loginRequest } from "../../app/auth/msalConfig";
import { debugLog } from "./debugLog";

const RETURN_TO_KEY = "mc.returnTo";

/**
 * RequireAuth: Route-level auth protection
 * Stores the intended path when user tries to access a protected route without auth.
 * AuthGuard (at app level) handles the actual redirect after auth completes.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { instance, inProgress } = useMsal();
  const location = useLocation();

  // Read directly from the MSAL cache rather than useMsal().accounts.
  // The React state in MsalProvider can be [] on the very first render after a
  // redirect-back page load, before the provider has hydrated — which would
  // cause an unnecessary second loginRedirect.  getAllAccounts() hits the cache
  // synchronously and is the same source AuthGuard uses.
  const isAuthed = instance.getAllAccounts().length > 0;

  // Tracks which path has already triggered loginRedirect.  Prevents
  // React.StrictMode's double-invocation of effects from calling loginRedirect
  // twice on the same path.  A second loginRedirect throws inside MSAL's
  // acquireTokenRedirect, whose catch block calls resetRequestCache() — clearing
  // the interaction flag that handleRedirectPromise needs on the way back.
  const loginTriggeredForPath = useRef<string | null>(null);

  // When not authed and ready, store the path and initiate login
  useEffect(() => {
    if (!isAuthed && inProgress === InteractionStatus.None) {
      const toStore = location.pathname + location.search;

      // Guard: skip if we already fired loginRedirect for this exact path.
      if (loginTriggeredForPath.current === toStore) {
        debugLog("RequireAuth", `loginRedirect already in flight for ${toStore}, skipping`);
        return;
      }
      loginTriggeredForPath.current = toStore;

      debugLog("RequireAuth", `Not authed. Storing path: ${toStore}`);
      sessionStorage.setItem(RETURN_TO_KEY, toStore);
      localStorage.setItem(RETURN_TO_KEY, toStore);
      debugLog("RequireAuth", `Path stored in both sessionStorage and localStorage`);

      instance.loginRedirect({
        ...loginRequest,
        redirectStartPage: window.location.href,
      });
    }
  }, [isAuthed, inProgress, instance, location]);

  if (!isAuthed) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18 }}>
          {inProgress !== InteractionStatus.None ? "Finishing sign-in…" : "Signing you in…"}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
