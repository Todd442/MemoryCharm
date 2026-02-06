import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { entryByCode, entryByToken, getPlaybackUrl, verifyGlyph } from "../api";
import type { EntryResponse } from "../types";
import { GlyphAuthPanel } from "../../../components/GlyphAuthPanel";

type UiState =
  | { s: "loading"; detail: string }
  | { s: "ready"; entry: EntryResponse }
  | { s: "error"; message: string };

type PlaybackState = null | {
  url: string;
  type: "video" | "image" | "audio";
};

const tokenKey = (code: string) => `charm.token.${code}`;

function getTokenCaseInsensitive(search: string): string | null {
  const qs = new URLSearchParams(search);

  const direct = qs.get("token") || qs.get("Token") || qs.get("TOKEN");
  if (direct) return direct;

  for (const [k, v] of qs.entries()) {
    if (k.toLowerCase() === "token" && v) return v;
  }
  return null;
}

export function CharmEntryPage() {
  const nav = useNavigate();
  const { search } = useLocation();
  const { code } = useParams<{ code?: string }>();

  const token = getTokenCaseInsensitive(search);

  const [ui, setUi] = useState<UiState>({ s: "loading", detail: "Starting…" });
  const [playback, setPlayback] = useState<PlaybackState>(null);

  // Glyph UI state
  const [glyphBusy, setGlyphBusy] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setPlayback(null);
        setBlocked(false);
        setGlyphBusy(false);
        setAttemptsLeft(3);

        setUi({ s: "loading", detail: "Checking charm…" });

        let entry: EntryResponse | null = null;

        // 1) NFC bootstrap: /c?Token=...
        if (token) {
          entry = await entryByToken(token);
          if (cancelled) return;

          if (entry.kind === "claimed" || entry.kind === "unclaimed") {
            // Store token for this session under resolved code
            sessionStorage.setItem(tokenKey(entry.code), token);

            // Replace URL with clean route
            nav(`/c/${encodeURIComponent(entry.code)}`, { replace: true });
          }
        }
        // 2) Clean URL: /c/:code
        else if (code) {
          entry = await entryByCode(code);
          if (cancelled) return;
        } else {
          setUi({ s: "error", message: "Missing token or charm code." });
          return;
        }

        if (!entry) {
          setUi({ s: "error", message: "Unable to resolve charm." });
          return;
        }

        if (entry.kind === "not_found") {
          setUi({ s: "ready", entry });
          return;
        }

        if (entry.kind === "expired") {
          setUi({ s: "ready", entry });
          return;
        }

        if (entry.kind === "unclaimed") {
          nav(`/claim/${encodeURIComponent(entry.code)}`, { replace: true });
          return;
        }

        // claimed
        setUi({ s: "ready", entry });

        if (entry.authMode === "glyph") {
          setAttemptsLeft(entry.attemptsLeft ?? 3);
        }

        // If glyph-locked and we got here via clean URL without a session token, ask to tap again.
        const hasSessionToken = sessionStorage.getItem(tokenKey(entry.code));
        if (entry.authMode === "glyph" && !hasSessionToken) return;

        // Auto-play only for OPEN charms
        if (entry.configured && entry.authMode === "none") {
          setUi({ s: "loading", detail: "Awakening memory…" });
          const media = await getPlaybackUrl(entry.code);
          if (cancelled) return;

          setPlayback({ url: media.playbackUrl, type: media.memoryType });
          setUi({ s: "ready", entry });
        }
      } catch (err: any) {
        setUi({ s: "error", message: err?.message ?? "Something went wrong." });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, code, nav]);

  async function handleGlyphSubmit(glyph: string) {
    if (ui.s !== "ready") return;
    if (ui.entry.kind !== "claimed") return;
    if (ui.entry.authMode !== "glyph") return;
    if (blocked) return;

    const hasSessionToken = sessionStorage.getItem(tokenKey(ui.entry.code));
    if (!hasSessionToken) return;

    setGlyphBusy(true);
    try {
      const res = await verifyGlyph(ui.entry.code, glyph);

      if (res.ok) {
        if (res.playback) {
          setPlayback({ url: res.playback.playbackUrl, type: res.playback.memoryType });
        } else {
          setUi({ s: "loading", detail: "Awakening memory…" });
          const media = await getPlaybackUrl(ui.entry.code);
          setPlayback({ url: media.playbackUrl, type: media.memoryType });
        }
        setUi({ s: "ready", entry: ui.entry });
      } else {
        setAttemptsLeft(res.attemptsLeft);
        if (res.attemptsLeft <= 0) setBlocked(true);
      }
    } catch (err: any) {
      setUi({ s: "error", message: err?.message ?? "Glyph verification failed." });
    } finally {
      setGlyphBusy(false);
    }
  }

  // ===== Render =====
  if (ui.s === "loading") {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>Memory Charm</div>
        <div style={{ fontSize: 16, opacity: 0.85 }}>{ui.detail}</div>
      </div>
    );
  }

  if (ui.s === "error") {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>Memory Charm</div>
        <div style={{ marginTop: 8, color: "crimson" }}>{ui.message}</div>
        <div style={{ marginTop: 14 }}>
          <Link to="/">Return home</Link>
        </div>
      </div>
    );
  }

  const entry = ui.entry;

  if (entry.kind === "not_found") {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>Memory Charm</div>
        <div style={{ fontSize: 16, opacity: 0.9 }}>This charm can’t be found.</div>
        <div style={{ marginTop: 14 }}>
          <Link to="/">Return home</Link>
        </div>
      </div>
    );
  }

  if (entry.kind === "expired") {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>Memory Charm</div>
        <div style={{ fontSize: 16, opacity: 0.9 }}>This charm’s memory has faded.</div>
        <div style={{ marginTop: 14 }}>
          <Link to="/">Return home</Link>
        </div>
      </div>
    );
  }

  // claimed
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 26, marginBottom: 8 }}>Memory Charm</div>

      {!entry.configured && (
        <div style={{ marginTop: 12, opacity: 0.9 }}>
          This charm has not yet been awakened by its keeper.
        </div>
      )}

      {/* Glyph gate */}
      {entry.authMode === "glyph" && !playback && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 16, opacity: 0.9 }}>This charm is locked.</div>

          {!sessionStorage.getItem(tokenKey(entry.code)) ? (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "rgba(0,0,0,0.06)" }}>
              Please tap the charm again to awaken this memory.
            </div>
          ) : blocked ? (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "rgba(220,0,0,0.08)" }}>
              The charm rejects this attempt.
            </div>
          ) : (
            <GlyphAuthPanel attemptsLeft={attemptsLeft} busy={glyphBusy} onSubmit={handleGlyphSubmit} />
          )}
        </div>
      )}

      {/* Playback */}
      {playback && (
        <div style={{ marginTop: 16 }}>
          {playback.type === "video" && (
            <video src={playback.url} controls playsInline style={{ width: "100%", maxWidth: 980, borderRadius: 12 }} />
          )}
          {playback.type === "image" && (
            <img src={playback.url} alt="Memory" style={{ width: "100%", maxWidth: 980, borderRadius: 12 }} />
          )}
          {playback.type === "audio" && (
            <audio src={playback.url} controls style={{ width: "100%", maxWidth: 980 }} />
          )}
        </div>
      )}

      <div style={{ marginTop: 18, fontSize: 13, opacity: 0.7 }}>
        <Link to="/">Home</Link>
      </div>
    </div>
  );
}
