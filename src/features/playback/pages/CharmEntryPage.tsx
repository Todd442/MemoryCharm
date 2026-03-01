import { useEffect, useRef, useState } from "react";
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

/** Video player with magical buffering / error overlay.
 *  While buffering, the display cycles: magical phrase (3.8 s) → twinkle out
 *  → tech phrase (2.2 s) → twinkle back. After 7 s the magical text upgrades. */
function VideoPlayer({ url }: { url: string }) {
  const [loading, setLoading]         = useState(true);   // initial load until canPlay
  const [buffering, setBuffering]     = useState(false);  // mid-playback stall
  const [showTech, setShowTech]       = useState(false);
  const [twinkle, setTwinkle]         = useState(false);
  const [slowNetwork, setSlowNetwork] = useState(false);
  const [error, setError]             = useState(false);

  const cycleActive = useRef(false);
  const slowTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAll = () => {
    if (slowTimer.current)  { clearTimeout(slowTimer.current);  slowTimer.current  = null; }
    if (cycleTimer.current) { clearTimeout(cycleTimer.current); cycleTimer.current = null; }
  };

  // Recursive cycle: hold → sparkle out → swap text → fade in → repeat
  const runCycle = (isTech: boolean) => {
    if (!cycleActive.current) return;
    const hold = isTech ? 2200 : 3800;
    cycleTimer.current = setTimeout(() => {
      if (!cycleActive.current) return;
      setTwinkle(true);
      cycleTimer.current = setTimeout(() => {
        if (!cycleActive.current) return;
        setShowTech(prev => !prev);
        setTwinkle(false);
        runCycle(!isTech);
      }, 550);
    }, hold);
  };

  // Initial load complete — hide the overlay and start playback
  const handleCanPlay = () => {
    setLoading(false);
  };

  const handleWaiting = () => {
    if (cycleActive.current) return;
    cycleActive.current = true;
    setBuffering(true);
    setShowTech(false);
    setTwinkle(false);
    runCycle(false);
    slowTimer.current = setTimeout(() => setSlowNetwork(true), 7000);
  };

  const handlePlaying = () => {
    setLoading(false);
    cycleActive.current = false;
    clearAll();
    setBuffering(false);
    setShowTech(false);
    setTwinkle(false);
    setSlowNetwork(false);
  };

  const handleError = () => {
    cycleActive.current = false;
    clearAll();
    setLoading(false);
    setError(true);
    setBuffering(false);
  };

  useEffect(() => () => { cycleActive.current = false; clearAll(); }, []);

  const magicalText = slowNetwork
    ? "The memory is finding its way to you…"
    : "Summoning your memory…";

  const techText = slowNetwork
    ? "Your connection appears slow"
    : "Buffering";

  const showOverlay = loading || buffering || error;

  return (
    <div style={{ position: "relative" }}>
      <video
        src={url}
        controls
        playsInline
        className="pb-media"
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onStalled={handleWaiting}
        onPlaying={handlePlaying}
        onError={handleError}
      />
      {showOverlay && (
        <div className="pb-buffer-overlay">
          {error ? (
            <>
              <div className="pb-buffer-main pb-buffer-fadein">
                We can't seem to recall this memory… it's not gone
              </div>
              <div className="pb-buffer-sub">Unable to load · most likely a network problem</div>
            </>
          ) : (
            <div
              key={showTech ? "tech" : "magic"}
              className={`pb-buffer-main ${twinkle ? "pb-buffer-twinkle" : "pb-buffer-fadein"}`}
            >
              {showTech ? techText : magicalText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Fullscreen toggle button — hidden on browsers that don't support the API (e.g. iOS Safari). */
function FullscreenButton() {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!document.fullscreenEnabled) return null;

  function toggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return (
    <button className="pb-fs-btn" onClick={toggle} aria-label={isFs ? "Exit fullscreen" : "Enter fullscreen"}>
      {isFs ? (
        <svg viewBox="0 0 10 10" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.2">
          <polyline points="4,1 4,4 1,4" />
          <polyline points="9,4 6,4 6,1" />
          <polyline points="6,9 6,6 9,6" />
          <polyline points="1,6 4,6 4,9" />
        </svg>
      ) : (
        <svg viewBox="0 0 10 10" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.2">
          <polyline points="1,4 1,1 4,1" />
          <polyline points="6,1 9,1 9,4" />
          <polyline points="9,6 9,9 6,9" />
          <polyline points="4,9 1,9 1,6" />
        </svg>
      )}
    </button>
  );
}

/** Renders media inside a tight frame. The image/video determines the frame size. */
function PlaybackRenderer(props: { files: ContentFile[]; type: "video" | "image" | "audio" }) {
  const { files, type } = props;
  const nav = useNavigate();

  const brand = (
    <div className="pb-brand">
      <span onClick={() => nav("/")} style={{ cursor: "pointer" }}>Memory Charm</span>
      <FullscreenButton />
    </div>
  );

  if (files.length === 0) return null;

  if (type === "video") {
    return (
      <div className="pb-frame">
        {brand}
        <VideoPlayer url={files[0].url} />
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
