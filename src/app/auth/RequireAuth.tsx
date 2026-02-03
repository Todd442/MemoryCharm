import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "../../app/auth/msalConfig";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();

  // Prefer active account (set in main.tsx bootstrap), fall back to accounts array.
  const active = instance.getActiveAccount();
  const isAuthed = !!active || accounts.length > 0;

  useEffect(() => {
    // Only redirect when MSAL is idle and we truly have no account.
    if (!isAuthed && inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest);
    }
  }, [isAuthed, inProgress, instance]);

  // While MSAL is handling a redirect/login, show a stable loading screen.
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
