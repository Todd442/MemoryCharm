import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { entryByCode, entryByToken, getPlaybackUrls, verifyGlyph } from "../api";
import type { EntryResponse, ContentFile } from "../types";
import { GlyphAuthPanel } from "../../../components/GlyphAuthPanel";
import { MemoryGallery } from "../components/MemoryGallery";
import "../../claim/pages/ClaimCharmPage.css"; // shared .tePill styles

type UiState =
  | { s: "loading"; detail: string }
  | { s: "ready"; entry: EntryResponse }
  | { s: "error"; message: string };

type PlaybackState = null | {
  files: ContentFile[];
  type: "video" | "image" | "audio";
};

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
          return;
        }

        // Auto-play only for OPEN charms
        if (entry.configured && entry.authMode === "none") {
          setUi({ s: "loading", detail: "Awakening memory…" });
          const media = await getPlaybackUrls(entry.code);
          if (cancelled) return;

          setPlayback({ files: media.files, type: media.memoryType });
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
        if (res.playback) {
          setPlayback({ files: res.playback.files, type: res.playback.memoryType });
        } else {
          setUi({ s: "loading", detail: "Awakening memory…" });
          const media = await getPlaybackUrls(ui.entry.code);
          setPlayback({ files: media.files, type: media.memoryType });
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

  // Loading
  if (ui.s === "loading") {
    return (
      <div className="pb-frame pb-status">
        <div className="pb-status-title">Memory Charm</div>
        <div style={{ fontSize: "var(--fs-label)", opacity: 0.85 }}>{ui.detail}</div>
      </div>
    );
  }

  // Error
  if (ui.s === "error") {
    return (
      <div className="pb-frame pb-status">
        <div className="pb-status-title">Memory Charm</div>
        <div style={{ marginTop: 8, color: "#ff6a6a" }}>{ui.message}</div>
      </div>
    );
  }

  const entry = ui.entry;

  // Not found
  if (entry.kind === "not_found") {
    return (
      <div className="pb-frame pb-status">
        <div className="pb-status-title">Memory Charm</div>
        <div style={{ fontSize: "var(--fs-label)", opacity: 0.9 }}>
          This charm can't be found.
        </div>
      </div>
    );
  }

  // Expired
  if (entry.kind === "expired") {
    return (
      <div className="pb-frame pb-status">
        <div className="pb-status-title">Memory Charm</div>
        <div style={{ fontSize: "var(--fs-label)", opacity: 0.9 }}>
          This charm's memory has faded.
        </div>
      </div>
    );
  }

  // Unclaimed — shouldn't reach here (effect redirects), but satisfies TS narrowing
  if (entry.kind === "unclaimed") return null;

  // Claimed — not configured
  if (!entry.configured) {
    return (
      <div className="pb-frame pb-status">
        <div className="pb-status-title">Memory Charm</div>
        <div style={{ opacity: 0.9, fontSize: "var(--fs-label)" }}>
          This charm has not yet been awakened by its keeper.
        </div>
      </div>
    );
  }

  // Claimed — glyph gate (no playback yet)
  if (entry.authMode === "glyph" && !playback) {
    return (
      <div className="pb-frame pb-status">
        <div className="pb-status-title">Memory Charm</div>
        <div style={{ fontSize: "var(--fs-label)", opacity: 0.9 }}>This charm is locked.</div>

        {blocked ? (
          <div style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 10,
            background: "rgba(220,0,0,0.08)",
            border: "1px solid rgba(255,90,90,0.18)",
            color: "#ff6a6a",
            fontSize: "var(--fs-meta)",
          }}>
            The charm rejects this attempt.
          </div>
        ) : (
          <GlyphAuthPanel attemptsLeft={attemptsLeft} busy={glyphBusy} onSubmit={handleGlyphSubmit} glyphs={entry.glyphs} />
        )}
      </div>
    );
  }

  // Playback — media is the hero
  if (playback) {
    return <PlaybackRenderer files={playback.files} type={playback.type} />;
  }

  // Fallback
  return null;
}

/** Renders media inside a tight frame. The image/video determines the frame size. */
function PlaybackRenderer(props: { files: ContentFile[]; type: "video" | "image" | "audio" }) {
  const { files, type } = props;
  const nav = useNavigate();

  const brand = (
    <div className="pb-brand" onClick={() => nav("/")} style={{ cursor: "pointer" }}>
      Memory Charm
    </div>
  );

  if (files.length === 0) return null;

  if (type === "video") {
    return (
      <div className="pb-frame">
        {brand}
        <video src={files[0].url} controls playsInline className="pb-media" />
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="pb-frame pb-status">
        <div className="pb-status-title" onClick={() => nav("/")} style={{ cursor: "pointer" }}>
          Memory Charm
        </div>
        <audio src={files[0].url} controls style={{ width: "100%", maxWidth: 400 }} />
      </div>
    );
  }

  // Single image
  if (files.length === 1) {
    return (
      <div className="pb-frame">
        {brand}
        <img src={files[0].url} alt="Memory" className="pb-media" />
      </div>
    );
  }

  // Multiple images — 3D gallery
  return <MemoryGallery files={files} />;
}
