import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "../auth/msalConfig";

/**
 * Route guard: ensures user is authenticated before rendering children.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthed = accounts.length > 0;

  useEffect(() => {
    if (!isAuthed && inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest);
    }
  }, [isAuthed, inProgress, instance]);

  if (!isAuthed) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18 }}>Signing you in…</div>
      </div>
    );
  }

  return <>{children}</>;
}
