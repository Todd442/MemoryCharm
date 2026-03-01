#!/usr/bin/env node
/**
 * Memory Charm – PWA icon generator
 * Pure Node.js, no external dependencies.
 * Run: node scripts/generate-icons.mjs
 *
 * Design: dark warm background, concentric gold rings,
 * nested diamond charm (pendant silhouette), centre gem dot.
 */

import zlib from 'node:zlib';
import fs   from 'node:fs';

// ── CRC32 (required by PNG spec) ───────────────────────────────────────────

const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_T[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
};

// ── PNG writer ─────────────────────────────────────────────────────────────

function pngChunk(type, data) {
  const t = Buffer.from(type);
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const l = Buffer.allocUnsafe(4); l.writeUInt32BE(d.length);
  const cv = Buffer.allocUnsafe(4); cv.writeUInt32BE(crc32(Buffer.concat([t, d])));
  return Buffer.concat([l, t, d, cv]);
}

/** rgba: Uint8Array, RGBA row-major */
function encodePNG(w, h, rgba) {
  const rowStride = 1 + w * 4;
  const raw = Buffer.allocUnsafe(h * rowStride);
  for (let y = 0; y < h; y++) {
    raw[y * rowStride] = 0; // filter: None
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4;
      const d = y * rowStride + 1 + x * 4;
      raw[d] = rgba[s]; raw[d+1] = rgba[s+1]; raw[d+2] = rgba[s+2]; raw[d+3] = rgba[s+3];
    }
  }

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Design (all values in virtual 512 × 512 space) ────────────────────────

// Palette (0–255)
const BG   = [11, 10, 8];      // #0b0a08  deep warm black
const GOLD = [203, 177, 138];  // #cbb18a  engraved gold
const GLOW = [60, 35, 12];     // warm amber for the centre radiance

/**
 * Returns [r, g, b, 255] for a virtual-space coordinate (vx, vy).
 * Both values are in [0, 512].
 */
function samplePixel(vx, vy) {
  const dx = vx - 256;
  const dy = vy - 256;
  const dist = Math.hypot(dx, dy);

  // Start with background + warm centre glow
  const glowT = Math.max(0, 1 - dist / 300) ** 2;
  let r = BG[0] + GLOW[0] * glowT * 0.22;
  let g = BG[1] + GLOW[1] * glowT * 0.22;
  let b = BG[2] + GLOW[2] * glowT * 0.22;

  // Blend gold over the current colour by `t`
  const blendGold = (t) => {
    if (t <= 0) return;
    const tc = Math.min(1, t);
    r = r + (GOLD[0] - r) * tc;
    g = g + (GOLD[1] - g) * tc;
    b = b + (GOLD[2] - b) * tc;
  };

  // ── Rings ──────────────────────────────────────────────────────────────
  // ringCover: smooth 1-px antialias on both edges of the stroke
  const ringCover = (radius, halfW) =>
    Math.max(0, Math.min(1, halfW + 1 - Math.abs(dist - radius)));

  blendGold(ringCover(212, 4) * 0.78);  // outer ring
  blendGold(ringCover(174, 2) * 0.50);  // inner ring

  // Very subtle disc fill inside inner ring
  blendGold(Math.max(0, Math.min(1, 174 - dist)) * 0.055);

  // ── Outer diamond (pendant silhouette) ─────────────────────────────────
  // Rhombus half-widths: hx=128, hyTop=162 (taller above centre = hangs like a pendant)
  const ODhx = 128, ODhyT = 162, ODhyB = 136;
  const odhy = dy <= 0 ? ODhyT : ODhyB;
  const oddist = Math.abs(dx) / ODhx + Math.abs(dy) / odhy;

  if (oddist <= 1.018) {
    // Antialias at the outer edge (oddist 1.0–1.018)
    const aa = Math.max(0, Math.min(1, (1.018 - oddist) / 0.018));
    if (oddist > 0.94) {
      blendGold(aa * 0.92); // outline band
    } else {
      blendGold(0.09 * aa); // soft interior fill
    }
  }

  // ── Inner diamond (nested gem facet) ───────────────────────────────────
  const IDhx = 47, IDhyT = 58, IDhyB = 50;
  const idhy = dy <= 0 ? IDhyT : IDhyB;
  const iddist = Math.abs(dx) / IDhx + Math.abs(dy) / idhy;

  if (iddist <= 1.025) {
    const aa = Math.max(0, Math.min(1, (1.025 - iddist) / 0.025));
    blendGold(iddist > 0.88 ? aa * 0.88 : aa * 0.32);
  }

  // ── Centre gem dot ─────────────────────────────────────────────────────
  blendGold(Math.max(0, Math.min(1, 9 - dist + 1)) * 0.95);

  // ── Cardinal accent dots on outer ring ─────────────────────────────────
  for (const [ax, ay] of [[256, 46], [466, 256], [256, 466], [46, 256]]) {
    const ad = Math.hypot(vx - ax, vy - ay);
    blendGold(Math.max(0, Math.min(1, 7 - ad + 1)) * 0.65);
  }

  return [
    Math.round(Math.min(255, r)),
    Math.round(Math.min(255, g)),
    Math.round(Math.min(255, b)),
    255,
  ];
}

// ── 2× supersampled renderer ───────────────────────────────────────────────

/**
 * @param {number} size       Output pixel size (e.g. 192 or 512)
 * @param {number} padding    Fractional inset for maskable icons (e.g. 0.11)
 */
function renderIcon(size, padding = 0) {
  const SS  = 2;            // supersampling factor (2×2 = 4 samples/pixel)
  const pad = size * padding;
  const inner = size - 2 * pad;
  const scale = inner / 512; // pixel → virtual-space

  const rgba = new Uint8Array(size * size * 4);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let sr = 0, sg = 0, sb = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const spx = px + (sx + 0.5) / SS;
          const spy = py + (sy + 0.5) / SS;
          const vx  = (spx - pad) / scale;
          const vy  = (spy - pad) / scale;

          let pix;
          if (vx < 0 || vx > 512 || vy < 0 || vy > 512) {
            pix = [BG[0], BG[1], BG[2], 255]; // background border for maskable
          } else {
            pix = samplePixel(vx, vy);
          }

          sr += pix[0]; sg += pix[1]; sb += pix[2];
        }
      }

      const inv = 1 / (SS * SS);
      const i = (py * size + px) * 4;
      rgba[i]   = Math.round(sr * inv);
      rgba[i+1] = Math.round(sg * inv);
      rgba[i+2] = Math.round(sb * inv);
      rgba[i+3] = 255;
    }
  }

  return rgba;
}

// ── Generate files ─────────────────────────────────────────────────────────

const icons = [
  { file: 'public/icons/icon-192.png',          size: 192, padding: 0    },
  { file: 'public/icons/icon-512.png',          size: 512, padding: 0    },
  { file: 'public/icons/icon-512-maskable.png', size: 512, padding: 0.11 },
];

for (const { file, size, padding } of icons) {
  process.stdout.write(`  Generating ${file} (${size}×${size})... `);
  const rgba = renderIcon(size, padding);
  fs.writeFileSync(file, encodePNG(size, size, rgba));
  console.log('done');
}

console.log('\n✓ Icons written to public/icons/');
