import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { entryByCode, entryByToken, getPlaybackUrls, verifyGlyph } from "../api";
import type { EntryResponse, ContentFile } from "../types";
import { GlyphAuthPanel } from "../../../components/GlyphAuthPanel";
import { MemoryGallery } from "../components/MemoryGallery";
import { FullscreenButton } from "../components/FullscreenButton";
import { ReportIssueDialog } from "../components/ReportIssueDialog";
import { usePwaInstall } from "../../../app/hooks/usePwaInstall";
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
  const { search, state: navState } = useLocation();
  const { code } = useParams<{ code?: string }>();
  // true when the router state explicitly marks this as an owner navigation
  // (set by CharmDetailPage and ClaimCharmPage). Also true when the API
  // confirms ownership via the optionally-attached Bearer token (covers NFC
  // scans and direct URL visits where the owner is already signed in).
  type NavState = { isOwner?: boolean; prefetchedEntry?: EntryResponse } | null;
  const navIsOwner = (navState as NavState)?.isOwner === true;
  const prefetchedEntry = (navState as NavState)?.prefetchedEntry ?? null;

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
            nav(`/c/${encodeURIComponent(entry.code)}`, { replace: true, state: { prefetchedEntry: entry, isOwner: entry.kind === "claimed" && entry.isOwner === true } });
            return;
          }
        }
        // 2) Clean URL: /c/:code — use prefetched entry from NFC path if available
        else if (code) {
          if (prefetchedEntry) {
            entry = prefetchedEntry;
          } else {
            entry = await entryByCode(code);
            if (cancelled) return;
          }
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

        // claimed — if the current user is the owner and didn't arrive via an
        // explicit owner navigation (e.g. preview from the admin page), send
        // them to their charm management page instead of the playback view.
        if (entry.kind === "claimed" && entry.isOwner === true && !navIsOwner) {
          nav(`/account/charms/${encodeURIComponent(entry.code)}`, { replace: true });
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
          // Files are included in the entry response — skip the second API call
          if (entry.files && entry.files.length > 0) {
            setPlayback({ files: entry.files, type: entry.memoryType ?? "image" });
            setUi({ s: "ready", entry });
          } else {
            setUi({ s: "loading", detail: "Awakening memory…" });
            const media = await getPlaybackUrls(entry.code);
            if (cancelled) return;
            setPlayback({ files: media.files, type: media.memoryType });
            setUi({ s: "ready", entry });
          }
        }
      } catch (err: any) {
        setUi({ s: "error", message: err?.message ?? "Something went wrong." });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, code, nav, navIsOwner, prefetchedEntry]);

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
        <div className="pb-explain" style={{ marginTop: 8, color: "#ff6a6a" }}>{ui.message}</div>
        <a
          href="/nfc-check"
          onClick={e => { e.preventDefault(); nav("/nfc-check"); }}
          style={{ marginTop: 20, fontSize: "var(--fs-label)", opacity: 0.6, color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          Having trouble with your charm?
        </a>
      </div>
    );
  }

  const entry = ui.entry;

  // Not found
  if (entry.kind === "not_found") {
    return (
      <div className="pb-frame pb-status">
        <div className="pb-status-title">Memory Charm</div>
        <div className="pb-explain" style={{ fontSize: "var(--fs-label)", opacity: 0.9 }}>
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
        <div className="pb-explain" style={{ fontSize: "var(--fs-label)", opacity: 0.9 }}>
          This charm's memory has faded.
        </div>
      </div>
    );
  }

  // Unclaimed — redirected in effect above; hold while the navigation processes
  if (entry.kind === "unclaimed") return (
    <div className="pb-frame pb-status">
      <div className="pb-status-title">Memory Charm</div>
    </div>
  );

  // Claimed — not configured
  if (!entry.configured) {
    return (
      <div className="pb-frame pb-status">
        <div className="pb-status-title">Memory Charm</div>
        <div className="pb-explain" style={{ opacity: 0.9, fontSize: "var(--fs-label)" }}>
          This charm has not yet been awakened by its keeper.
        </div>
      </div>
    );
  }

  // Claimed — glyph gate (no playback yet)
  if (entry.authMode === "glyph" && !playback) {
    return (
      <div className="pb-frame pb-status">
        {blocked ? (
          <div className="pb-explain" style={{
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
    return (
      <PlaybackRenderer
        files={playback.files}
        type={playback.type}
        code={entry.code}
        memoryName={entry.memoryName}
        memoryDescription={entry.memoryDescription}
        isOwner={navIsOwner || entry.isOwner === true}
      />
    );
  }

  // Fallback
  return null;
}

/** Video player with magical buffering / error overlay.
 *  While buffering, the display cycles: magical phrase (3.8 s) → twinkle out
 *  → tech phrase (2.2 s) → twinkle back. After 7 s the magical text upgrades. */
function VideoPlayer({ url, code, isOwner }: { url: string; code?: string; isOwner?: boolean }) {
  const [loading, setLoading]         = useState(true);   // initial load until canPlay
  const [buffering, setBuffering]     = useState(false);  // mid-playback stall
  const [showTech, setShowTech]       = useState(false);
  const [twinkle, setTwinkle]         = useState(false);
  const [slowNetwork, setSlowNetwork] = useState(false);
  const [error, setError]             = useState(false);
  const [showReport, setShowReport]   = useState(false);
  const [triggerVisible, setTriggerVisible] = useState(false);

  const cycleActive = useRef(false);
  const slowTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAll = () => {
    if (slowTimer.current)  { clearTimeout(slowTimer.current);  slowTimer.current  = null; }
    if (cycleTimer.current) { clearTimeout(cycleTimer.current); cycleTimer.current = null; }
  };

  // Show the report trigger once the video has settled (loaded or errored).
  // Using useEffect means it fires even if isOwner prop arrives after canPlay.
  useEffect(() => {
    if (!isOwner || !code) return;
    if (loading && !error) return; // wait until video has loaded or failed
    const delay = error ? 0 : 5000;
    const t = setTimeout(() => setTriggerVisible(true), delay);
    return () => clearTimeout(t);
  }, [isOwner, code, loading, error]);

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

  useEffect(() => () => { cycleActive.current = false; clearAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const magicalText = slowNetwork
    ? "The memory is finding its way to you…"
    : "Summoning your memory…";

  const techText = slowNetwork
    ? "Your connection appears slow"
    : "Buffering";

  const showOverlay = loading || buffering || error;

  return (
    <div style={{ position: "relative" }}>
      {isOwner && code && triggerVisible && !showReport && (
        <button
          className="pb-report-trigger"
          onClick={() => setShowReport(true)}
          aria-label="Report a playback issue"
        >
          Having trouble with this video?
        </button>
      )}
      {isOwner && code && showReport && (
        <ReportIssueDialog
          code={code}
          videoUrl={url}
          onClose={() => setShowReport(false)}
        />
      )}
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

/** Slide-up toast offering PWA installation. Appears 4 s after playback starts. */
function PwaInstallToast() {
  const { canInstall, isIos, triggerInstall } = usePwaInstall();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, [dismissed]);

  if (dismissed || !visible || (!canInstall && !isIos)) return null;

  return (
    <div className="pb-install-toast" role="status">
      <div className="pb-install-toast-body">
        <div className="pb-install-toast-title">Keep this memory close</div>
        <div className="pb-install-toast-sub">
          {isIos
            ? "Tap Share \u2192 Add to Home Screen"
            : "Add Memory Charm to your home screen"}
        </div>
      </div>
      {canInstall && (
        <button className="pb-install-toast-action" onClick={triggerInstall} type="button">
          Install
        </button>
      )}
      <button
        className="pb-install-toast-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        type="button"
      >
        <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="1" y1="1" x2="9" y2="9" />
          <line x1="9" y1="1" x2="1" y2="9" />
        </svg>
      </button>
    </div>
  );
}

/** Renders media inside a tight frame. The image/video determines the frame size. */
function PlaybackRenderer(props: {
  files: ContentFile[];
  type: "video" | "image" | "audio";
  code?: string;
  memoryName?: string;
  memoryDescription?: string;
  isOwner?: boolean;
}) {
  const { files, type, code, memoryName, memoryDescription, isOwner } = props;
  const nav = useNavigate();
  const [imgReady, setImgReady] = useState(false);

  const brandDest = isOwner && code ? `/account/charms/${encodeURIComponent(code)}` : "/";

  const brand = (
    <div className="pb-brand">
      <div className="pb-brand__title" onClick={() => nav(brandDest)} style={{ cursor: "pointer" }}>
        {memoryName ? (
          <>
            <span className="pb-brand__name">{memoryName}</span>
            <span className="pb-brand__sub">Memory Charm</span>
          </>
        ) : (
          <span>Memory Charm</span>
        )}
      </div>
      <FullscreenButton />
    </div>
  );

  if (files.length === 0) return null;

  if (type === "video") {
    return (
      <>
        <div className="pb-frame">
          {brand}
          <VideoPlayer url={files[0].url} code={code} isOwner={isOwner} />
          {memoryDescription && (
            <div className="pb-memory-desc">{memoryDescription}</div>
          )}
        </div>
        <PwaInstallToast />
      </>
    );
  }

  if (type === "audio") {
    return (
      <>
        <div className="pb-frame pb-status">
          <div
            className={memoryName ? "pb-status-title pb-status-title--named" : "pb-status-title"}
            onClick={() => nav(brandDest)}
            style={{ cursor: "pointer" }}
          >
            {memoryName ? memoryName : "Memory Charm"}
          </div>
          {memoryName && (
            <div style={{ fontSize: "var(--fs-meta)", opacity: 0.5, letterSpacing: "0.15em", marginBottom: 10 }}>
              Memory Charm
            </div>
          )}
          <audio src={files[0].url} controls style={{ width: "100%", maxWidth: 400 }} />
          {memoryDescription && (
            <div className="pb-memory-desc pb-memory-desc--static" style={{ marginTop: 16 }}>
              {memoryDescription}
            </div>
          )}
        </div>
        <PwaInstallToast />
      </>
    );
  }

  // Single image
  if (files.length === 1) {
    return (
      <>
        <div className="pb-frame">
          {brand}
          <img
            src={files[0].url}
            alt="Memory"
            className={`pb-media${imgReady ? " pb-media--ready" : ""}`}
            onLoad={() => setImgReady(true)}
          />
          {memoryDescription && (
            <div className="pb-memory-desc">{memoryDescription}</div>
          )}
        </div>
        <PwaInstallToast />
      </>
    );
  }

  // Multiple images — 3D gallery
  return (
    <MemoryGallery
      files={files}
      memoryName={memoryName}
      memoryDescription={memoryDescription}
      isOwner={isOwner}
      code={code}
    />
  );
}
