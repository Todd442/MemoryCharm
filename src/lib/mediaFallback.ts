import type { SyntheticEvent } from "react";

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
  el.src = fallbackUrl;
  return true;
}

/** onError handler for <img>/<video>/<audio> that switches to the fallback URL. */
export function fallbackOnError(fallbackUrl?: string | null) {
  if (!fallbackUrl) return undefined;
  return (e: SyntheticEvent<HTMLImageElement | HTMLMediaElement>) => {
    tryFallback(e.currentTarget, fallbackUrl);
  };
}
