import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ContentFile } from "../types";
import { FullscreenButton } from "./FullscreenButton";
import "./MemoryGallery.css";

// ── Helix animation constants ─────────────────────────────────────────────────
const HELIX_TURNS = 3;        // coil rotations across the full screen height
const HELIX_SPEED = 0.0000058; // t-units per millisecond (~172 s full cycle)
const CARD_COUNT  = 12;       // cards in flight (repeats files if count < 12)

// Truncate to a maximum number of words, appending "…" when clipped
function truncateWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/);
  return words.length <= max ? text : words.slice(0, max).join(" ") + "…";
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

interface CardState {
  id: number;
  t: number;           // position in [0,1), drives Y position & coil angle
  phaseOffset: number; // unique offset per card for X/Z variety
}

interface Dims {
  W: number; H: number;
  RADIUS_X: number; RADIUS_Z: number; FOCAL: number;
  CARD_W: number; CARD_H: number; TEXT_HALF_H: number;
}

function computeDims(): Dims {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const vmin = Math.min(W, H);
  return {
    W, H,
    RADIUS_X:    W    * 0.30,
    RADIUS_Z:    vmin * 0.30,
    FOCAL:       vmin * 1.20,
    CARD_W:      vmin * 0.28,
    CARD_H:      vmin * 0.17,
    // Scale dead-zone to H so the ratio is consistent in portrait & landscape
    TEXT_HALF_H: H * 0.07,
  };
}

// Golden-angle phase distribution — even spread around the coil
const GOLDEN_ANGLE = 2.399963; // radians ≈ 2π × (1 − 1/φ)

function initCards(n: number): CardState[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    t: i / n,
    phaseOffset: (i * GOLDEN_ANGLE) % (Math.PI * 2),
  }));
}

function getCardStyle(
  card: CardState,
  dims: Dims,
  aspectRatio?: number,
): React.CSSProperties | null {
  const { W, H, RADIUS_X, RADIUS_Z, FOCAL, CARD_W, CARD_H, TEXT_HALF_H } = dims;

  // ── 3-D helix position ────────────────────────────────────────────────────
  const angle    = card.t * HELIX_TURNS * Math.PI * 2 + card.phaseOffset;
  const y        = card.t * H;
  const x        = W / 2 + Math.sin(angle) * RADIUS_X;
  const z        = Math.cos(angle) * RADIUS_Z;
  const zShifted = z + RADIUS_Z + 1; // always positive
  const scale    = FOCAL / (FOCAL + zShifted);

  // Long side = CARD_W; portrait/landscape tiles match the image's aspect ratio
  const r = aspectRatio ?? (CARD_W / CARD_H);
  const w = (r >= 1 ? CARD_W     : CARD_W * r) * scale;
  const h = (r >= 1 ? CARD_W / r : CARD_W    ) * scale;

  // ── Alpha (all fade sources combined) ─────────────────────────────────────
  // 1. Wrap fade — wide 15% zones at top & bottom so the wrap is invisible
  let alpha = smoothstep(0, 0.15, card.t) * smoothstep(1, 0.85, card.t);
  // 2. Logo dead-zone — cards fade when overlapping the central brand text
  alpha *= smoothstep(TEXT_HALF_H * 0.8, TEXT_HALF_H * 2.5, Math.abs(y - H / 2));
  // 3. Screen-edge fade — one card-width margin left & right
  const margin = CARD_W * 0.9;
  alpha *= smoothstep(0, margin, x) * smoothstep(W, W - margin, x);
  // 4. Depth fade — back of the coil gently dims
  const maxZ  = RADIUS_Z * 2 + 1;
  const depth = zShifted / maxZ;
  alpha *= smoothstep(1, 0.65, depth);

  if (alpha <= 0.015) return null;

  // ── Depth-based border glow (closer = brighter gold ring) ─────────────────
  const borderA   = (0.15 + (1 - depth) * 0.55).toFixed(2);
  const shadowBlur = Math.round(16 * scale);
  const shadowOff  = Math.round(4  * scale);
  const borderW    = Math.max(1, Math.round(1.5 * scale));

  return {
    position:   "absolute",
    left:       0,
    top:        0,
    width:      `${w}px`,
    height:     `${h}px`,
    transform:  `translate(${(x - w / 2).toFixed(1)}px,${(y - h / 2).toFixed(1)}px)`,
    opacity:    Math.min(1, Math.max(0, alpha)),
    zIndex:     Math.floor((1 - depth) * 100),
    willChange: "transform, opacity",
    boxShadow:  `0 ${shadowOff}px ${shadowBlur}px rgba(0,0,0,0.65),` +
                `0 0 0 ${borderW}px rgba(210,170,110,${borderA})`,
  };
}

/**
 * Helix gallery — images flow through a 3D coil that scrolls continuously
 * down the screen. The nebula background shows through each faded-edge card.
 * Tap any card to zoom it into the framed detail view.
 */
export function MemoryGallery(props: {
  files: ContentFile[];
  memoryName?: string;
  memoryDescription?: string;
  isOwner?: boolean;
  code?: string;
}) {
  const { files, memoryName, memoryDescription, isOwner, code } = props;
  const nav  = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);
  const [focusImgReady, setFocusImgReady] = useState(false);
  const [, setTick] = useState(0);

  const dimsRef        = useRef<Dims>(computeDims());
  const cardsRef       = useRef<CardState[]>(initCards(CARD_COUNT));
  const pausedRef      = useRef(false);
  const rafRef         = useRef<number | null>(null);
  const aspectRatioRef = useRef<Map<number, number>>(new Map());

  const handleImageLoad = useCallback((fileIdx: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      aspectRatioRef.current.set(fileIdx, img.naturalWidth / img.naturalHeight);
    }
  }, []);

  const handleSelect = useCallback((fileIdx: number) => {
    setSelected(fileIdx);
    pausedRef.current = true;
  }, []);

  const handleDismiss = useCallback(() => {
    setSelected(null);
    pausedRef.current = false;
  }, []);

  const handleNext = useCallback(() => {
    setSelected(s => s === null ? 0 : (s + 1) % files.length);
    pausedRef.current = true;
  }, [files.length]);

  const handlePrev = useCallback(() => {
    setSelected(s => s === null ? 0 : (s - 1 + files.length) % files.length);
    pausedRef.current = true;
  }, [files.length]);

  const touchStartXRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) handleNext();
    else handlePrev();
  }, [handleNext, handlePrev]);

  // Reset focused image fade-in whenever a new image is selected
  useLayoutEffect(() => {
    setFocusImgReady(false);
  }, [selected]);

  // Keyboard navigation when focused view is open
  useEffect(() => {
    if (selected === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "Escape") handleDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, handleNext, handlePrev, handleDismiss]);

  useEffect(() => {
    function onResize() { dimsRef.current = computeDims(); }
    window.addEventListener("resize", onResize);

    let lastTs     = 0;
    let lastRender = 0;

    function loop(ts: number) {
      const dt = lastTs ? ts - lastTs : 0;
      lastTs = ts;

      if (!pausedRef.current) {
        for (const card of cardsRef.current) {
          card.t = (card.t + HELIX_SPEED * dt) % 1;
        }
      }

      if (ts - lastRender >= 1000 / 30) {
        lastRender = ts;
        setTick(c => c + 1);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const isOpen = selected !== null;
  const dims   = dimsRef.current;
  const n      = files.length;

  return (
    <div className="mg-scene">
      <div className={`mg-space ${isOpen ? "mg-space--dimmed" : ""}`}>

        {/* Central brand anchor */}
        <button className="mg-logo" onClick={() => nav(isOwner && code ? `/account/charms/${encodeURIComponent(code)}` : "/")}>
          {memoryName && <div className="mg-logo__name">{truncateWords(memoryName, 5)}</div>}
          <div className="mg-logo__text">Memory</div>
          <div className="mg-logo__sub">Charm</div>
          {memoryDescription && (
            <div className="mg-logo__desc">{memoryDescription}</div>
          )}
        </button>

        {/* Helix image cards */}
        {cardsRef.current.map((card) => {
          const fileIdx     = card.id % n;
          const aspectRatio = aspectRatioRef.current.get(fileIdx);
          const style       = getCardStyle(card, dims, aspectRatio);
          const file = files[fileIdx];
          return (
            <button
              key={card.id}
              className="mg-card"
              style={style ?? { position: "absolute", visibility: "hidden", pointerEvents: "none" }}
              onClick={() => !isOpen && style && handleSelect(fileIdx)}
              tabIndex={isOpen || !style ? -1 : 0}
              aria-label={`Memory ${fileIdx + 1} of ${n}`}
            >
              <img
                src={file.url}
                alt=""
                className="mg-card__img"
                draggable={false}
                onLoad={(e) => handleImageLoad(fileIdx, e)}
              />
            </button>
          );
        })}
      </div>

      {/* Zoomed-in framed view */}
      {isOpen && (
        <div className="mg-focus" onClick={handleDismiss}>
          <div
            className="mg-focus__frame"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="pb-brand">
              <button
                className="mg-focus__close"
                onClick={handleDismiss}
                aria-label="Close"
              >
                &times;
              </button>
              <span onClick={() => nav(isOwner && code ? `/account/charms/${encodeURIComponent(code)}` : "/")} style={{ cursor: "pointer" }}>
                Memory Charm
              </span>
              <FullscreenButton />
            </div>

            <div className="mg-focus__media-wrap">
              {n > 1 && (
                <button className="mg-focus__arrow mg-focus__arrow--prev" onClick={handlePrev} aria-label="Previous image">
                  &#8249;
                </button>
              )}
              <img
                src={files[selected!].url}
                alt={`Memory ${selected! + 1} of ${n}`}
                className={`pb-media${focusImgReady ? " pb-media--ready" : ""}`}
                onLoad={() => setFocusImgReady(true)}
              />
              {n > 1 && (
                <button className="mg-focus__arrow mg-focus__arrow--next" onClick={handleNext} aria-label="Next image">
                  &#8250;
                </button>
              )}
            </div>

            {n > 1 && (
              <div className="mg-focus__dots">
                {n <= 15
                  ? files.map((_, i) => (
                      <button
                        key={i}
                        className={`mg-focus__dot${i === selected ? " mg-focus__dot--active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); setSelected(i); pausedRef.current = true; }}
                        aria-label={`Go to image ${i + 1}`}
                      />
                    ))
                  : <span className="mg-focus__counter">{selected! + 1} / {n}</span>
                }
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
