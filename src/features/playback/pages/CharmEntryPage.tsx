import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { entryByCode, entryByToken, getPlaybackUrls, verifyGlyph } from "../api";
import type { EntryResponse, ContentFile } from "../types";
import { GlyphAuthPanel } from "../../../components/GlyphAuthPanel";
import "../../claim/pages/ClaimCharmPage.css"; // shared .tePill styles
import "../../account/pages/CharmDetailPage.css"; // shared .teCharmWrap/.teCharmPanel/.teCharmSection

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
          return; // Glyph charms wait for user to submit the correct glyph
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
  if (ui.s === "loading") {
    return (
      <div className="teCharmWrap">
        <div className="teCharmPanel">
          <div className="teCharmSection">
            <div className="teCharmSectionTitle">Memory Charm</div>
            <div style={{ fontSize: "var(--fs-label)", opacity: 0.85 }}>{ui.detail}</div>
          </div>
        </div>
      </div>
    );
  }

  if (ui.s === "error") {
    return (
      <div className="teCharmWrap">
        <div className="teCharmPanel">
          <div className="teCharmSection">
            <div className="teCharmSectionTitle">Memory Charm</div>
            <div style={{ marginTop: 8, color: "#ff6a6a" }}>{ui.message}</div>
          </div>
          <div className="teCharmNav">
            <Link to="/">Return home</Link>
          </div>
        </div>
      </div>
    );
  }

  const entry = ui.entry;

  if (entry.kind === "not_found") {
    return (
      <div className="teCharmWrap">
        <div className="teCharmPanel">
          <div className="teCharmSection">
            <div className="teCharmSectionTitle">Memory Charm</div>
            <div style={{ fontSize: "var(--fs-label)", opacity: 0.9 }}>This charm can't be found.</div>
          </div>
          <div className="teCharmNav">
            <Link to="/">Return home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (entry.kind === "expired") {
    return (
      <div className="teCharmWrap">
        <div className="teCharmPanel">
          <div className="teCharmSection">
            <div className="teCharmSectionTitle">Memory Charm</div>
            <div style={{ fontSize: "var(--fs-label)", opacity: 0.9 }}>This charm's memory has faded.</div>
          </div>
          <div className="teCharmNav">
            <Link to="/">Return home</Link>
          </div>
        </div>
      </div>
    );
  }

  // claimed
  return (
    <div className="teCharmWrap">
      <div className="teCharmPanel">
        <div className="teCharmSection">
          <div className="teCharmSectionTitle">Memory Charm</div>

          {!entry.configured && (
            <div style={{ opacity: 0.9, fontSize: "var(--fs-label)" }}>
              This charm has not yet been awakened by its keeper.
            </div>
          )}

          {/* Glyph gate */}
          {entry.authMode === "glyph" && !playback && (
            <>
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
            </>
          )}

          {/* Playback */}
          {playback && <PlaybackRenderer files={playback.files} type={playback.type} />}
        </div>

        <div className="teCharmNav">
          <Link to="/">Home</Link>
        </div>
      </div>
    </div>
  );
}

/** Renders content files based on memory type. */
function PlaybackRenderer(props: { files: ContentFile[]; type: "video" | "image" | "audio" }) {
  const { files, type } = props;

  if (files.length === 0) return null;

  if (type === "video") {
    return (
      <div style={{ marginTop: 16 }}>
        <video src={files[0].url} controls playsInline style={{ width: "100%", maxWidth: 980, borderRadius: 12 }} />
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div style={{ marginTop: 16 }}>
        <audio src={files[0].url} controls style={{ width: "100%", maxWidth: 980 }} />
      </div>
    );
  }

  // Image(s)
  if (files.length === 1) {
    return (
      <div style={{ marginTop: 16 }}>
        <img src={files[0].url} alt="Memory" style={{ width: "100%", maxWidth: 980, borderRadius: 12 }} />
      </div>
    );
  }

  return <ImageSlideshow files={files} />;
}

/** Simple prev/next slideshow for multiple images. */
function ImageSlideshow(props: { files: ContentFile[] }) {
  const { files } = props;
  const [index, setIndex] = useState(0);

  return (
    <div style={{ marginTop: 16 }}>
      <img
        src={files[index].url}
        alt={`Memory ${index + 1} of ${files.length}`}
        style={{ width: "100%", maxWidth: 980, borderRadius: 12 }}
      />
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          style={{ padding: "4px 12px" }}
        >
          Prev
        </button>
        <span style={{ fontSize: "var(--fs-small)", opacity: 0.8 }}>
          {index + 1} / {files.length}
        </span>
        <button
          onClick={() => setIndex((i) => Math.min(files.length - 1, i + 1))}
          disabled={index === files.length - 1}
          style={{ padding: "4px 12px" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
