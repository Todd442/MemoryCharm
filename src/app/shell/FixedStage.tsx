import React, { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    const onResize = () => {
      const vv = window.visualViewport;
      if (vv) {
        setVw(vv.width);
        setVh(vv.height);
      } else {
        setVw(window.innerWidth);
        setVh(window.innerHeight);
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
