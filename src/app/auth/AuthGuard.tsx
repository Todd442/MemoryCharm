import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useNavigate } from "react-router-dom";
import { debugLog } from "./debugLog";

const RETURN_TO_KEY = "mc.returnTo";

/**
 * AuthGuard: Top-level auth protection wrapper
 * Handles auth state and redirects to stored paths after login completes.
 * Must be rendered INSIDE the MsalProvider and RouterProvider.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { inProgress, accounts, instance } = useMsal();
  const navigate = useNavigate();

  // Also check instance accounts directly
  const allAccounts = instance.getAllAccounts();
  
  debugLog("AuthGuard", `Render: inProgress=${inProgress}, accounts.length=${accounts.length}, allAccounts.length=${allAccounts.length}`);

  // When auth interaction completes (inProgress transitions from non-None to None),
  // check if we have a stored return path and navigate to it
  useEffect(() => {
    const allAccounts = instance.getAllAccounts();
    debugLog("AuthGuard", `Effect trigger: inProgress=${inProgress}, accounts.length=${accounts.length}, allAccounts.length=${allAccounts.length}`);
    
    if (inProgress === InteractionStatus.None && allAccounts.length > 0) {
      const returnTo = sessionStorage.getItem(RETURN_TO_KEY) || localStorage.getItem(RETURN_TO_KEY);
      debugLog("AuthGuard", `Auth complete. inProgress: ${inProgress}, allAccounts: ${allAccounts.length}, returnTo: ${returnTo}`);
      if (returnTo) {
        debugLog("AuthGuard", `Navigating to stored path: ${returnTo}`);
        sessionStorage.removeItem(RETURN_TO_KEY);
        localStorage.removeItem(RETURN_TO_KEY);
        // Use React Router's navigate to go to the stored path
        navigate(returnTo);
      } else {
        debugLog("AuthGuard", "Auth complete but no stored returnTo path found!");
      }
    }
  }, [inProgress, instance, navigate]);

  return <>{children}</>;
}
