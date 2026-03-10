import React, { useEffect, useMemo, useRef, useState } from "react";

type FitMode = "contain" | "cover";

export function FixedStage(props: {
  width: number;   // design width, e.g. 900
  height: number;  // design height, e.g. 1600
  fit?: FitMode;   // contain recommended
  minScale?: number; // optional clamp
  maxScale?: number; // optional clamp
  background?: string; // optional
  children: React.ReactNode;
}) {
  const fit = props.fit ?? "contain";
  const minScale = props.minScale ?? 0.25;
  const maxScale = props.maxScale ?? 4;

  const [vw, setVw] = useState(() => window.innerWidth);
  const [vh, setVh] = useState(() => window.innerHeight);
  // Track the last width at which we accepted a height update.
  // When the soft keyboard opens on Android, the width stays the same but
  // the height shrinks — we ignore that to prevent the stage from rescaling.
  // When orientation changes the width changes too, so we accept both dimensions.
  const lastAcceptedVwRef = useRef(window.innerWidth);

  useEffect(() => {
    const onResize = () => {
      const vv = window.visualViewport;
      const newVw = vv ? vv.width : window.innerWidth;
      const newVh = vv ? vv.height : window.innerHeight;

      setVw(newVw);

      if (newVw !== lastAcceptedVwRef.current) {
        // Orientation change — accept the new height unconditionally.
        lastAcceptedVwRef.current = newVw;
        setVh(newVh);
      } else {
        // Width unchanged: only grow vh. A shrink is almost always the soft
        // keyboard appearing; growing back means the keyboard was dismissed.
        setVh(prev => Math.max(prev, newVh));
      }
    };

    onResize();

    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize); // iOS can shift viewport when keyboard appears

    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
    };
  }, []);

  const { scale, offsetX, offsetY } = useMemo(() => {
    const sx = vw / props.width;
    const sy = vh / props.height;

    let s = fit === "cover" ? Math.max(sx, sy) : Math.min(sx, sy);
    s = Math.max(minScale, Math.min(maxScale, s));

    const contentW = props.width * s;
    const contentH = props.height * s;

    return {
      scale: s,
      offsetX: Math.round((vw - contentW) / 2),
      offsetY: Math.round((vh - contentH) / 2),
    };
  }, [vw, vh, props.width, props.height, fit, minScale, maxScale]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: props.background ?? "black",

        // IMPORTANT: allow natural scrolling gestures to reach inner scroll containers
        touchAction: "auto",

        // Avoid accidental selection / bounce artifacts on mobile
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: offsetX,
          top: offsetY,
          width: props.width,
          height: props.height,
          transformOrigin: "top left",
          transform: `scale(${scale})`,

          // Allow text selection inside inputs etc. (we’ll re-enable per page)
          pointerEvents: "auto",
        }}
      >
        {props.children}
      </div>
    </div>
  );
}
