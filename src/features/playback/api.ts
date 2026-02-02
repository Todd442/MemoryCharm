import type { EntryResponse } from "./types";

async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function entryByToken(token: string): Promise<EntryResponse> {
  return postJson("/api/entry/by-token", { token });
}

export function entryByCode(code: string): Promise<EntryResponse> {
  return getJson(`/api/entry/by-code/${encodeURIComponent(code)}`);
}

export type PlaybackResponse = {
  memoryType: "video" | "image" | "audio";
  playbackUrl: string;
};

export function getPlaybackUrl(code: string): Promise<PlaybackResponse> {
  return getJson(`/api/c/${encodeURIComponent(code)}/playback-url`);
}

export function verifyGlyph(code: string, glyph: string): Promise<{ ok: boolean; attemptsLeft: number }> {
  return postJson(`/api/c/${encodeURIComponent(code)}/auth/verify-glyph`, { glyph });
}
