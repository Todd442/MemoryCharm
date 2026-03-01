import { useEffect, useState } from "react";

/** Fullscreen toggle button — hidden on browsers that don't support the API (e.g. iOS Safari). */
export function FullscreenButton() {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!document.fullscreenEnabled) return null;

  function toggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return (
    <button className="pb-fs-btn" onClick={toggle} aria-label={isFs ? "Exit fullscreen" : "Enter fullscreen"}>
      {isFs ? (
        <svg viewBox="0 0 10 10" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.2">
          <polyline points="4,1 4,4 1,4" />
          <polyline points="9,4 6,4 6,1" />
          <polyline points="6,9 6,6 9,6" />
          <polyline points="1,6 4,6 4,9" />
        </svg>
      ) : (
        <svg viewBox="0 0 10 10" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.2">
          <polyline points="1,4 1,1 4,1" />
          <polyline points="6,1 9,1 9,4" />
          <polyline points="9,6 9,9 6,9" />
          <polyline points="4,9 1,9 1,6" />
        </svg>
      )}
    </button>
  );
}
