import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CURRENT_TERMS_VERSION,
  getUserMe,
  isUlaCachedLocally,
  cacheUlaLocally,
} from "../api/profileApi";

type Status = "checking" | "accepted" | "required";

const RETURN_TO_KEY = "mc.ulaReturnTo";

/**
 * RequireUla: Ensures the authenticated user has accepted the current Terms.
 * Place this inside <RequireAuth> on any protected route.
 *
 * Fast path: localStorage cache → renders children immediately.
 * Slow path: API call to check termsVersion on the user profile.
 * If terms are not accepted, redirects to /terms/accept, storing the intended
 * path so the user is returned there after acceptance.
 */
export function RequireUla({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<Status>(
    isUlaCachedLocally() ? "accepted" : "checking"
  );

  useEffect(() => {
    if (status !== "checking") return;

    let cancelled = false;

    getUserMe()
      .then(({ termsVersion }) => {
        if (cancelled) return;

        if (termsVersion === CURRENT_TERMS_VERSION) {
          // Server confirms acceptance — warm the cache and proceed
          cacheUlaLocally();
          setStatus("accepted");
        } else {
          // Store the intended destination so we can return after acceptance
          sessionStorage.setItem(RETURN_TO_KEY, location.pathname);
          setStatus("required");
        }
      })
      .catch(() => {
        if (!cancelled) {
          // If we can't reach the API, block until we can — don't silently bypass
          sessionStorage.setItem(RETURN_TO_KEY, location.pathname);
          setStatus("required");
        }
      });

    return () => { cancelled = true; };
  }, [status, location.pathname]);

  useEffect(() => {
    if (status === "required") {
      navigate("/terms/accept", { replace: true });
    }
  }, [status, navigate]);

  if (status === "accepted") return <>{children}</>;
  return null;
}

/** Returns and clears the path stored before the ULA redirect. */
export function consumeUlaReturnTo(): string | null {
  const path = sessionStorage.getItem(RETURN_TO_KEY);
  if (path) sessionStorage.removeItem(RETURN_TO_KEY);
  return path;
}
