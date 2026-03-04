import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { debugLog } from "../../../app/auth/debugLog";

export function NotFoundPage() {
  const { pathname } = useLocation();
  useEffect(() => {
    debugLog("404", pathname);
  }, [pathname]);
  return <Navigate to="/" replace />;
}
