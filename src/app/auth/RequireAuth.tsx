import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useLocation } from "react-router-dom";
import { loginRequest } from "../../app/auth/msalConfig";

const RETURN_TO_KEY = "mc.returnTo";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const location = useLocation();

  const active = instance.getActiveAccount();
  const isAuthed = !!active || accounts.length > 0;

  // When not authed, capture the router location and redirect to login
  useEffect(() => {
    if (!isAuthed && inProgress === InteractionStatus.None) {
      const toStore = location.pathname + location.search;
      sessionStorage.setItem(RETURN_TO_KEY, toStore);
      localStorage.setItem(RETURN_TO_KEY, toStore); // Also store in localStorage as backup

      instance.loginRedirect({
        ...loginRequest,
        redirectStartPage: window.location.href,
      });
    }
  }, [isAuthed, inProgress, instance, location]);

  // Clear stored return path if we are authenticated
  useEffect(() => {
    if (isAuthed) {
      sessionStorage.removeItem(RETURN_TO_KEY);
      localStorage.removeItem(RETURN_TO_KEY);
    }
  }, [isAuthed]);

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
