import { useRef, useEffect } from "react";

export interface HelixCard {
  id: number;
  color: string;
  imageSrc?: string;
}

interface Props {
  cards?: HelixCard[];
  dimFactor?: number; // 0 = full, 1 = fully dimmed
}

const PALETTE = [
  "#5a3a1a", "#1a3a2e", "#1a2a4a", "#3a1a5a",
  "#5a1a2e", "#1a3a1a", "#3a1a1a", "#4a3a1a",
  "#1a3a3a", "#5a1a1a", "#3a4a1a", "#1a2a3a",
];

function defaultCards(): HelixCard[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    color: PALETTE[i % PALETTE.length],
  }));
}

export function LandingHelix({ cards, dimFactor = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimRef = useRef(dimFactor);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const cardsRef = useRef(cards ?? defaultCards());

  useEffect(() => {
    dimRef.current = dimFactor;
  }, [dimFactor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // Golden-angle phase distribution — same even spread as MemoryGallery
    const GOLDEN_ANGLE = 2.399963; // ≈ 2π × (1 − 1/φ)
    const state = cardsRef.current.map((c, i) => ({
      ...c,
      t: i / cardsRef.current.length,
      phase: (i * GOLDEN_ANGLE) % (Math.PI * 2),
    }));

    // Preload images — record natural aspect ratio on load
    const aspectRatios = new Map<string, number>();
    state.forEach(c => {
      if (!c.imageSrc || imagesRef.current.has(c.imageSrc)) return;
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight)
          aspectRatios.set(c.imageSrc!, img.naturalWidth / img.naturalHeight);
      };
      img.src = c.imageSrc;
      imagesRef.current.set(c.imageSrc, img);
    });

    const TURNS       = 3;
    const HELIX_SPEED = 0.0000058; // t-units per ms — same as MemoryGallery

    let W = 0, H = 0;
    let RX = 0, RZ = 0, FOCAL = 0, CW = 0, CH = 0;
    let TY = 0, THH = 0;
    let glowPhase = 0;
    let hitRects: { id: number; x: number; y: number; w: number; h: number }[] = [];
    let raf = 0;

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale once; all draw code uses CSS pixels
      const min = Math.min(W, H);
      RX    = W   * 0.30;
      RZ    = min * 0.30;
      FOCAL = min * 1.20;
      CW    = min * 0.28;
      CH    = min * 0.17;
      const fs = Math.min(W * 0.08, 80);
      ctx.font = `${fs}px "Cinzel", Georgia, serif`;
      TY  = H / 2;
      THH = H * 0.07; // proportional to H, same logic as MemoryGallery
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    resize();

    function smoothstep(a: number, b: number, x: number) {
      const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    }

    function getPos(t: number, phase: number) {
      const angle = t * TURNS * Math.PI * 2 + phase;
      const x  = W / 2 + Math.sin(angle) * RX;
      const y  = t * H;
      const z  = Math.cos(angle) * RZ;
      const zs = z + RZ + 1;
      return { x, y, zs, scale: FOCAL / (FOCAL + zs) };
    }

    function drawCard(pos: ReturnType<typeof getPos>, card: typeof state[0]) {
      const { x, y, zs, scale } = pos;
      // CW is the long-side constraint; card shape matches the image orientation
      const ar = card.imageSrc ? (aspectRatios.get(card.imageSrc) ?? CW / CH) : CW / CH;
      const w = (ar >= 1 ? CW      : CW * ar) * scale;
      const h = (ar >= 1 ? CW / ar : CW     ) * scale;
      const r = Math.max(4, 8 * scale);

      const wf = 0.15;
      let alpha = smoothstep(0, wf, card.t) * smoothstep(1, 1 - wf, card.t);
      alpha *= smoothstep(THH * 0.8, THH * 2.5, Math.abs(y - TY));
      const mg = CW * 0.9;
      alpha *= smoothstep(0, mg, x) * smoothstep(W, W - mg, x);
      const maxZ  = RZ * 2 + 1;
      const depth = zs / maxZ;
      alpha *= smoothstep(1, 0.65, depth);
      alpha *= 1 - dimRef.current;

      if (alpha <= 0.015) return null;

      // Don't show the placeholder colour while the image is still loading
      if (card.imageSrc) {
        const img = imagesRef.current.get(card.imageSrc);
        if (!img?.complete || img.naturalWidth === 0) return null;
      }


      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha);

      ctx.shadowColor   = "rgba(0,0,0,0.65)";
      ctx.shadowBlur    = 16 * scale;
      ctx.shadowOffsetY = 4 * scale;

      ctx.fillStyle = card.color;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, r);
      ctx.fill();

      const img = card.imageSrc ? imagesRef.current.get(card.imageSrc) : undefined;
      if (img?.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x - w / 2, y - h / 2, w, h, r);
        ctx.clip();
        ctx.shadowBlur    = 0;
        ctx.shadowOffsetY = 0;
        const ia = img.naturalWidth / img.naturalHeight;
        const ca = w / h;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (ia > ca) { sw = sh * ca; sx = (img.naturalWidth  - sw) / 2; }
        else         { sh = sw / ca; sy = (img.naturalHeight - sh) / 2; }
        ctx.drawImage(img, sx, sy, sw, sh, x - w / 2, y - h / 2, w, h);
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fill();
        ctx.restore();
      }

      ctx.shadowBlur    = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = `rgba(210,170,110,${0.15 + (1 - depth) * 0.55})`;
      ctx.lineWidth   = Math.max(1, 1.5 * scale);
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, r);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.restore();
      return { id: card.id, x: x - w / 2, y: y - h / 2, w, h };
    }

    function drawTitle() {
      const brightness = 1 - dimRef.current;
      if (brightness < 0.02) return;
      glowPhase += 0.018;
      const pulse = 0.55 + Math.sin(glowPhase) * 0.18; // gentle breathing
      const fs = Math.min(W * 0.08, 80);
      const cx = W / 2;
      const cy = H / 2;

      ctx.save();
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${fs}px "Cinzel", Georgia, serif`;

      // "Memory" — solid metallic gold, glow breathes not the text
      ctx.shadowColor = `rgba(210,170,110,${pulse * 0.35 * brightness})`;
      ctx.shadowBlur  = 14 + Math.sin(glowPhase) * 8;
      ctx.fillStyle   = `rgba(210,170,110,${0.90 * brightness})`;
      ctx.fillText("Memory", cx, cy - fs * 0.52);

      // "Charm" — slightly softer, matches the subtitle tone
      ctx.shadowBlur  = 0;
      ctx.fillStyle   = `rgba(200,160,100,${0.65 * brightness})`;
      ctx.fillText("Charm", cx, cy + fs * 0.52);

      ctx.restore();
    }

    let lastTs = 0;
    function frame(ts: number) {
      const dt = lastTs ? ts - lastTs : 0;
      lastTs = ts;

      ctx.clearRect(0, 0, W, H);

      state.forEach(c => {
        c.t = (c.t + HELIX_SPEED * dt) % 1;
      });

      const projected = state
        .map(c => ({ c, pos: getPos(c.t, c.phase) }))
        .sort((a, b) => b.pos.zs - a.pos.zs);

      hitRects = [];
      projected.forEach(({ c, pos }) => {
        const rect = drawCard(pos, c);
        if (rect) hitRects.push(rect);
      });

      drawTitle();
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    />
  );
}
