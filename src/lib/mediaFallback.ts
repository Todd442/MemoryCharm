import type { SyntheticEvent } from "react";
import { track } from "./analytics";

/**
 * Charm media is served from R2, with an Azure SAS URL as `fallbackUrl` in case
 * the R2 copy is missing or unreachable. Swaps the element to the fallback once;
 * returns false if there is no fallback or it is already in use (a real failure).
 */
export function tryFallback(
  el: HTMLImageElement | HTMLMediaElement,
  fallbackUrl?: string | null
): boolean {
  if (!fallbackUrl || el.src === fallbackUrl) return false;
  // Early warning for R2 problems: a missing object or outage shows up here first
  track("media_fallback_used", { element: el.tagName.toLowerCase(), primary_host: hostOf(el.src) });
  el.src = fallbackUrl;
  return true;
}

/** onError handler for <img>/<video>/<audio> that switches to the fallback URL. */
export function fallbackOnError(fallbackUrl?: string | null) {
  return (e: SyntheticEvent<HTMLImageElement | HTMLMediaElement>) => {
    if (!tryFallback(e.currentTarget, fallbackUrl)) {
      track("media_load_failed", { element: e.currentTarget.tagName.toLowerCase(), had_fallback: !!fallbackUrl });
    }
  };
}

function hostOf(url: string): string | undefined {
  try { return new URL(url).host; } catch { return undefined; }
}
