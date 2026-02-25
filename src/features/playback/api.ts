import type { EntryResponse, PlaybackUrlResponse } from "./types";
import {
  normalizeApiResponse,
  toEntryResponse,
  toPlaybackUrls,
  toGlyphVerifyResult,
  type CharmStatusApiResponse,
} from "./apiAdapters";
import { API_BASE } from "../../app/http/apiClient";

/** Safely parse JSON and normalize PascalCase keys to camelCase. */
async function safeJsonNormalized(res: Response): Promise<CharmStatusApiResponse | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return normalizeApiResponse(JSON.parse(text));
  } catch {
    return null;
  }
}

/**
 * Entry by NFC token. The SPA already extracts the code from the URL param
 * (/c?Token=t:CODE) and navigates to /c/:code. This just delegates.
 */
export function entryByToken(token: string): Promise<EntryResponse> {
  const code = token.startsWith("t:") ? token.slice(2) : token;
  return entryByCode(code);
}

/**
 * Entry by charm code. GET /api/charm/{code}
 */
export async function entryByCode(code: string): Promise<EntryResponse> {
  const res = await fetch(`${API_BASE}/api/charm/${encodeURIComponent(code)}`, {
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) {
    return { kind: "not_found" };
  }

  const body = await safeJsonNormalized(res);
  if (!body) {
    throw new Error(`API returned ${res.status} with no parseable body`);
  }
  return toEntryResponse(body, res.status);
}

export type PlaybackResponse = PlaybackUrlResponse;

/**
 * Get playback URLs for an open (no-auth) charm.
 * The GET /api/charm/{code} response includes Files[] when status="ready".
 */
export async function getPlaybackUrls(code: string): Promise<PlaybackResponse> {
  const res = await fetch(`${API_BASE}/api/charm/${encodeURIComponent(code)}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  const body = await safeJsonNormalized(res);
  if (!body) {
    throw new Error("Empty response from API");
  }

  const playback = toPlaybackUrls(body);
  if (!playback) {
    throw new Error("Content not yet available");
  }

  return playback;
}

/**
 * Verify glyph for a charm. POST /api/charm/{code} with { glyphId }.
 * Accepts a glyph GUID string. Returns playback URLs on success.
 */
export async function verifyGlyph(
  code: string,
  glyphId: string
): Promise<{
  ok: boolean;
  attemptsLeft: number;
  playback: PlaybackResponse | null;
}> {
  const res = await fetch(`${API_BASE}/api/charm/${encodeURIComponent(code)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ glyphId }),
  });

  const body = await safeJsonNormalized(res);
  if (!body) {
    throw new Error(`Glyph verify returned ${res.status} with no parseable body`);
  }
  return toGlyphVerifyResult(body, res.status);
}
