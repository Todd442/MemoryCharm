// src/features/playback/pages/CharmEntryPage.tsx
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

export function CharmEntryPage() {
  const nav = useNavigate();
  const { code } = useParams<{ code?: string }>();
  const { search } = useLocation();
  const qs = new URLSearchParams(search);
  const token = qs.get("token");

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
        // Reset per navigation/load
        setPlayback(null);
        setBlocked(false);
        setGlyphBusy(false);
        setAttemptsLeft(3);

        setUi({ s: "loading", detail: "Checking charm…" });

        const entry = token
          ? await entryByToken(token)
          : code
          ? await entryByCode(code)
          : null;

        if (cancelled) return;

        if (!entry) {
          setUi({ s: "error", message: "This link is missing its charm token." });
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

        // Normalize token URL to /c/:code
        if (token && entry.kind !== "not_found" && entry.kind !== "expired") {
          nav(`/c/${encodeURIComponent(entry.code)}`, { replace: true });
        }

        if (entry.kind === "unclaimed") {
          nav(`/claim/${encodeURIComponent(entry.code)}`, { replace: true });
          return;
        }

        // claimed
        setUi({ s: "ready", entry });

        // If glyph auth required, capture attemptsLeft if provided
        if (entry.authMode === "glyph") {
          setAttemptsLeft(entry.attemptsLeft ?? 3);
        }

        // If no glyph auth required, immediately fetch playback
        if (entry.configured && entry.authMode === "none") {
          setUi({ s: "loading", detail: "Awakening memory…" });
          const media = await getPlaybackUrl(entry.code);
          if (cancelled) return;

          setPlayback({
            url: media.playbackUrl,
            type: media.memoryType,
          });

          // Back to ready state for display
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

    setGlyphBusy(true);
    try {
      const res = await verifyGlyph(ui.entry.code, glyph);

      if (res.ok) {
        setUi({ s: "loading", detail: "Awakening memory…" });

        const media = await getPlaybackUrl(ui.entry.code);
        setPlayback({ url: media.playbackUrl, type: media.memoryType });

        // Return to ready view (player shows)
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

  // Not found / expired states (product-like copy)
  if (entry.kind === "not_found") {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>Memory Charm</div>
        <div style={{ fontSize: 16, opacity: 0.9 }}>
          This charm can’t be found.
        </div>
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
        <div style={{ fontSize: 16, opacity: 0.9 }}>
          This charm’s memory has faded.
        </div>
        <div style={{ marginTop: 14 }}>
          <Link to="/">Return home</Link>
        </div>
      </div>
    );
  }

  // From here: claimed (unclaimed is redirected earlier)
  if (entry.kind !== "claimed") {
    // Defensive fallback; should never hit
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>Memory Charm</div>
        <div style={{ fontSize: 16, opacity: 0.9 }}>
          This charm is in an unknown state.
        </div>
      </div>
    );
  }

  // Main claimed view
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 26, marginBottom: 8 }}>Memory Charm</div>

      {/* If glyph gate required and we haven't unlocked yet */}
      {entry.authMode === "glyph" && !playback && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 16, opacity: 0.9 }}>
            This charm is locked.
          </div>

          {blocked ? (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 10,
                background: "rgba(220,0,0,0.08)",
              }}
            >
              The charm rejects this attempt.
            </div>
          ) : (
            <GlyphAuthPanel
              attemptsLeft={attemptsLeft}
              busy={glyphBusy}
              onSubmit={handleGlyphSubmit}
            />
          )}
        </div>
      )}

      {/* Playback */}
      {playback && (
        <div style={{ marginTop: 16 }}>
          {playback.type === "video" && (
            <video
              src={playback.url}
              controls
              playsInline
              style={{ width: "100%", maxWidth: 980, borderRadius: 12 }}
            />
          )}

          {playback.type === "image" && (
            <img
              src={playback.url}
              alt="Memory"
              style={{ width: "100%", maxWidth: 980, borderRadius: 12 }}
            />
          )}

          {playback.type === "audio" && (
            <audio src={playback.url} controls style={{ width: "100%", maxWidth: 980 }} />
          )}
        </div>
      )}

      {/* If claimed but not configured (future-proof copy) */}
      {!entry.configured && (
        <div style={{ marginTop: 16, opacity: 0.9 }}>
          This charm has not yet been awakened by its keeper.
        </div>
      )}

      {/* Small footer link (handy during dev) */}
      <div style={{ marginTop: 18, fontSize: 13, opacity: 0.7 }}>
        <Link to="/">Home</Link>
      </div>
    </div>
  );
}
