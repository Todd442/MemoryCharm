import type { EntryResponse, PlaybackUrlResponse, MemoryType } from "./types";

/** Shape returned by GET /api/charm/{code} and POST /api/charm/{code} */
export type CharmStatusApiResponse = {
  status: string;
  code: string;
  primary?: string;
  fallback?: string;
  memoryType?: string;
  expiresIn?: number;
  authMode?: string;
  attemptsLeft?: number;
  message?: string;
};

/**
 * Normalize an object's keys to camelCase.
 * .NET's System.Text.Json returns PascalCase by default (Status, Code, Primary…)
 * but we want camelCase (status, code, primary…).
 */
function camelKeys<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k[0].toLowerCase() + k.slice(1)] = v;
  }
  return out as T;
}

/** Normalize raw API JSON into our expected camelCase shape. */
export function normalizeApiResponse(raw: Record<string, unknown>): CharmStatusApiResponse {
  return camelKeys(raw) as CharmStatusApiResponse;
}

/**
 * Maps a GET /api/charm/{code} response to the SPA's EntryResponse.
 */
export function toEntryResponse(
  api: CharmStatusApiResponse,
  httpStatus: number
): EntryResponse {
  if (httpStatus === 404) {
    return { kind: "not_found" };
  }

  if (httpStatus === 403 || api.status === "locked") {
    return { kind: "expired" };
  }

  if (api.status === "unconfigured") {
    return { kind: "unclaimed", code: api.code };
  }

  if (api.status === "auth_required") {
    return {
      kind: "claimed",
      code: api.code,
      configured: true,
      authMode: "glyph",
      attemptsLeft: api.attemptsLeft ?? 3,
    };
  }

  if (api.status === "ready") {
    return {
      kind: "claimed",
      code: api.code,
      configured: true,
      authMode: "none",
      memoryType: (api.memoryType as MemoryType) ?? "video",
    };
  }

  return { kind: "not_found" };
}

/**
 * Extracts playback URL info from an API response that includes content URLs.
 */
export function toPlaybackUrl(
  api: CharmStatusApiResponse
): PlaybackUrlResponse | null {
  const url = api.primary ?? api.fallback;
  if (!url) return null;

  return {
    playbackUrl: url,
    memoryType: (api.memoryType as MemoryType) ?? "video",
  };
}

/**
 * Maps a POST /api/charm/{code} glyph verify response.
 */
export function toGlyphVerifyResult(
  api: CharmStatusApiResponse,
  httpStatus: number
): {
  ok: boolean;
  attemptsLeft: number;
  playback: PlaybackUrlResponse | null;
} {
  const isSuccess =
    httpStatus === 200 && (api.status === "ok" || api.status === "ready");

  return {
    ok: isSuccess,
    attemptsLeft: api.attemptsLeft ?? 0,
    playback: isSuccess ? toPlaybackUrl(api) : null,
  };
}
