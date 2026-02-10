import type { EntryResponse, PlaybackUrlResponse, MemoryType, ContentFile } from "./types";

/** Shape returned by GET /api/charm/{code} and POST /api/charm/{code} */
export type CharmStatusApiResponse = {
  status: string;
  code: string;
  files?: { url: string; name: string }[];
  memoryType?: string;
  expiresIn?: number;
  authMode?: string;
  attemptsLeft?: number;
  message?: string;
  glyphs?: { id: string; name: string }[];
};

/**
 * Normalize an object's keys to camelCase (shallow).
 * .NET's System.Text.Json returns PascalCase by default (Status, Code…)
 * but we want camelCase (status, code…).
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
  const base = camelKeys(raw) as CharmStatusApiResponse;

  // Normalize nested file objects (PascalCase → camelCase)
  if (Array.isArray(base.files)) {
    base.files = base.files.map((f: Record<string, unknown>) =>
      camelKeys(f) as { url: string; name: string }
    );
  }

  // Normalize nested glyph objects (PascalCase → camelCase)
  if (Array.isArray(base.glyphs)) {
    base.glyphs = base.glyphs.map((g: Record<string, unknown>) =>
      camelKeys(g) as { id: string; name: string }
    );
  }

  return base;
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
      glyphs: api.glyphs,
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
 * Extracts playback info from an API response that includes content files.
 */
export function toPlaybackUrls(
  api: CharmStatusApiResponse
): PlaybackUrlResponse | null {
  if (!api.files || api.files.length === 0) return null;

  const files: ContentFile[] = api.files.map((f) => ({
    url: f.url,
    name: f.name,
  }));

  return {
    files,
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
    playback: isSuccess ? toPlaybackUrls(api) : null,
  };
}
