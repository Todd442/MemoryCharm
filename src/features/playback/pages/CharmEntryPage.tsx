import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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

        setUi({ s: "loading", detail: token ? "Validating token…" : "Looking up charm…" });

        const entry = token
          ? await entryByToken(token)
          : code
          ? await entryByCode(code)
          : null;

        if (cancelled) return;

        if (!entry) {
          setUi({ s: "error", message: "Missing token/code in URL." });
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

        // If token flow resolved to a canonical code, normalize URL to /c/:code
        if (token && entry.kind !== "not_found" && entry.kind !== "expired") {
          nav(`/c/${encodeURIComponent(entry.code)}`, { replace: true });
        }

        if (entry.kind === "unclaimed") {
          nav(`/claim/${encodeURIComponent(entry.code)}`, { replace: true });
          return;
        }

        // claimed
        setUi({ s: "ready", entry });

        // If no glyph auth required, immediately fetch playback
        if (entry.configured && entry.authMode === "none") {
          const media = await getPlaybackUrl(entry.code);
          if (cancelled) return;

          setPlayback({
            url: media.playbackUrl,
            type: media.memoryType,
          });
        }

        // If glyph auth required, capture attemptsLeft if provided
        if (entry.authMode === "glyph") {
          setAttemptsLeft(entry.attemptsLeft ?? 3);
        }
      } catch (err: any) {
        setUi({ s: "error", message: err?.message ?? "Request failed." });
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
        // Fetch playback on success
        const media = await getPlaybackUrl(ui.entry.code);
        setPlayback({ url: media.playbackUrl, type: media.memoryType });
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
        <div style={{ fontSize: 24 }}>Charm Entry</div>
        <div style={{ marginTop: 12 }}>{ui.detail}</div>
      </div>
    );
  }

  if (ui.s === "error") {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 24 }}>Charm Entry</div>
        <div style={{ marginTop: 12, color: "crimson" }}>Error: {ui.message}</div>
      </div>
    );
  }

  const entry = ui.entry;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 24 }}>Charm Entry</div>

      <div style={{ marginTop: 12 }}>
        <div>
          <strong>URL code:</strong> {code ?? "(none)"}
        </div>
        <div>
          <strong>URL token:</strong> {token ?? "(none)"}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <pre style={{ background: "#f4f4f4", padding: 12, borderRadius: 8, overflowX: "auto" }}>
          {JSON.stringify(entry, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: 12 }}>
        {entry.kind === "not_found" && <div>Result: Not found</div>}
        {entry.kind === "expired" && <div>Result: Expired</div>}
        {entry.kind === "claimed" && (
          <div>
            Result: Claimed (configured={String(entry.configured)} authMode={entry.authMode})
          </div>
        )}
      </div>

      {/* Glyph gate */}
      {entry.kind === "claimed" && entry.authMode === "glyph" && !playback && (
        <div style={{ marginTop: 18 }}>
          {blocked ? (
            <div style={{ padding: 12, borderRadius: 8, background: "rgba(220,0,0,0.08)" }}>
              The charm rejects this attempt.
            </div>
          ) : (
            <GlyphAuthPanel attemptsLeft={attemptsLeft} busy={glyphBusy} onSubmit={handleGlyphSubmit} />
          )}
        </div>
      )}

      {/* Playback */}
      {playback && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Playback</div>

          {playback.type === "video" && (
            <video src={playback.url} controls playsInline style={{ width: "100%", maxWidth: 980 }} />
          )}

          {playback.type === "image" && (
            <img src={playback.url} alt="Memory" style={{ width: "100%", maxWidth: 980 }} />
          )}

          {playback.type === "audio" && <audio src={playback.url} controls />}
        </div>
      )}
    </div>
  );
}
