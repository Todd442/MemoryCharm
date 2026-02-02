import type { EntryResponse, PlaybackUrlResponse } from "./types";
import { httpGet, httpPost } from "../../lib/http";

export async function entryByToken(token: string): Promise<EntryResponse> {
  // Prefer POST so token doesn't end up in server logs/query strings everywhere.
  return httpPost<EntryResponse>("/api/entry/by-token", { token });
}

export async function entryByCode(code: string): Promise<EntryResponse> {
  return httpGet<EntryResponse>(`/api/entry/by-code/${encodeURIComponent(code)}`);
}

export async function verifyGlyph(code: string, glyph: string): Promise<{ ok: boolean; attemptsLeft: number }> {
  return httpPost(`/api/c/${encodeURIComponent(code)}/auth/verify-glyph`, { glyph });
}

export async function getPlaybackUrl(code: string): Promise<PlaybackUrlResponse> {
  return httpGet<PlaybackUrlResponse>(`/api/c/${encodeURIComponent(code)}/playback-url`);
}
