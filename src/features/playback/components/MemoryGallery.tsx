import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { ContentFile } from "../types";
import { FullscreenButton } from "./FullscreenButton";
import "./MemoryGallery.css";

// Spiral constants
const TURNS = 2.5;    // rotations from center to edge
const MAX_R = 42;     // max radius in vmin
const SPEED = 0.04;   // full-cycle rev/sec → 25 s per loop
const DRIFT = 1.5;    // drift amplitude in vmin

function getVmin() {
  return Math.min(window.innerWidth, window.innerHeight) / 100;
}

/**
 * Compute inline style for card i in a spiral of n cards.
 * t ∈ [0,1): 0 = center, 1 = outer edge.
 * Cards fade in as they emerge from center, fade out before wrapping back.
 */
function getCardStyle(
  i: number,
  n: number,
  phase: number,
  time: number,
) {
  const t = ((i / n + phase) % 1 + 1) % 1;
  const vm = getVmin();

  // Archimedean spiral position
  const r = t * MAX_R * vm;
  const theta = t * TURNS * 2 * Math.PI;
  const cx = r * Math.cos(theta);
  const cy = r * Math.sin(theta);

  // Per-card drift (seeded by index so each card moves independently)
  const seed = i * 1.7;
  const dx = Math.sin(time * 0.4 + seed) * DRIFT * vm;
  const dy = Math.cos(time * 0.3 + seed * 0.7) * DRIFT * vm;

  // Size: 30 vmin near center → 18 vmin at outer edge
  const size = (18 + (1 - t) * 12) * vm;

  // Opacity: fade in during first 5%, fade out during last 15%
  const opacity =
    t < 0.05 ? t / 0.05 :
    t > 0.85 ? 1 - (t - 0.85) / 0.15 :
    1;

  return {
    position: "absolute" as const,
    left: "50%",
    top: "50%",
    width: `${size}px`,
    height: `${size * 0.75}px`,
    transform: `translate(calc(-50% + ${cx + dx}px), calc(-50% + ${cy + dy}px))`,
    opacity,
    zIndex: Math.floor((1 - t) * 100),
    willChange: "transform" as const,
  };
}

/**
 * Animated spiral gallery — images flow outward from the central logo,
 * larger near center and smaller at the edge, wrapping back continuously.
 * Tap any card to zoom it into a framed view; tap × or backdrop to dismiss.
 */
export function MemoryGallery(props: {
  files: ContentFile[];
  memoryName?: string;
  memoryDescription?: string;
}) {
  const { files, memoryName, memoryDescription } = props;
  const nav = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);
  const [, setTick] = useState(0);

  // Mutable refs updated by rAF loop — read at render time via setTick
  const phaseRef = useRef(0);
  const timeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const handleSelect = useCallback((i: number) => setSelected(i), []);
  const handleDismiss = useCallback(() => setSelected(null), []);
  const isOpen = selected !== null;

  // Animation loop: physics run every frame, renders throttled to ~30 fps
  useEffect(() => {
    let lastTs = 0;
    let lastRender = 0;

    function loop(ts: number) {
      const dt = lastTs ? (ts - lastTs) / 1000 : 0;
      lastTs = ts;

      phaseRef.current = (phaseRef.current + SPEED * dt) % 1;
      timeRef.current += dt;

      if (ts - lastRender >= 1000 / 30) {
        lastRender = ts;
        setTick((c) => c + 1);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const n = files.length;
  const phase = phaseRef.current;
  const time = timeRef.current;

  return (
    <div className="mg-scene">
      {/* Spiral space with logo + flowing images */}
      <div className={`mg-space ${isOpen ? "mg-space--dimmed" : ""}`}>

        {/* Central brand anchor */}
        <button className="mg-logo" onClick={() => nav("/")}>
          {memoryName && <div className="mg-logo__name">{memoryName}</div>}
          <div className="mg-logo__text">Memory</div>
          <div className="mg-logo__sub">Charm</div>
          {memoryDescription && (
            <div className="mg-logo__desc">{memoryDescription}</div>
          )}
        </button>

        {/* Spiralling image cards */}
        {files.map((file, i) => (
          <button
            key={i}
            className="mg-card"
            style={getCardStyle(i, n, phase, time)}
            onClick={() => !isOpen && handleSelect(i)}
            tabIndex={isOpen ? -1 : 0}
            aria-label={`Memory ${i + 1} of ${files.length}`}
          >
            <img src={file.url} alt="" className="mg-card__img" draggable={false} />
          </button>
        ))}
      </div>

      {/* Zoomed-in framed view */}
      {isOpen && (
        <div className="mg-focus" onClick={handleDismiss}>
          <div className="mg-focus__frame" onClick={(e) => e.stopPropagation()}>
            <div className="pb-brand">
              <button
                className="mg-focus__close"
                onClick={handleDismiss}
                aria-label="Close"
              >
                &times;
              </button>
              <span onClick={() => nav("/")} style={{ cursor: "pointer" }}>
                Memory Charm
              </span>
              <FullscreenButton />
            </div>
            <img
              src={files[selected!].url}
              alt={`Memory ${selected! + 1} of ${files.length}`}
              className="pb-media"
            />
          </div>
        </div>
      )}
    </div>
  );
}
