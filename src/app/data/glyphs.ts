/**
 * Glyph catalog — mirrors Mnemosyne.API/Models/Glyphs/GlyphDefinitions.cs exactly.
 * The order and UUIDs must match the API.
 *
 * Image filenames are deliberately randomised so sequential enumeration
 * of the asset folder reveals nothing about glyph count or ordering.
 */

import imgA3f8c21b from "../../assets/gx_a3f8c21b.png";
import img7d4e9f06 from "../../assets/gx_7d4e9f06.png";
import imgR6j3b5ht from "../../assets/gx_r6j3b5ht.png";
import imgW1c9g4ms from "../../assets/gx_w1c9g4ms.png";
import imgT8f2l6yn from "../../assets/gx_t8f2l6yn.png";
import imgH3q7x0kz from "../../assets/gx_h3q7x0kz.png";
import imgB5w9r2jp from "../../assets/gx_b5w9r2jp.png";
import imgN7d4v8fc from "../../assets/gx_n7d4v8fc.png";
import imgG2m6t1xq from "../../assets/gx_g2m6t1xq.png";
import imgY9k3h5bw from "../../assets/gx_y9k3h5bw.png";
import imgF4p8n0rd from "../../assets/gx_f4p8n0rd.png";
import imgX1j6c9mt from "../../assets/gx_x1j6c9mt.png";
import imgD7v2q4fs from "../../assets/gx_d7v2q4fs.png";
import imgL3w8g5kn from "../../assets/gx_l3w8g5kn.png";
import imgS6b1y9hx from "../../assets/gx_s6b1y9hx.png";
import imgM0f7t3vp from "../../assets/gx_m0f7t3vp.png";
import imgQ5x2d8jc from "../../assets/gx_q5x2d8jc.png";
import imgV4n9k6rw from "../../assets/gx_v4n9k6rw.png";

export type GlyphInfo = {
  name: string;
  id: string; // GUID string
  image: string;
};

export const ALL_GLYPHS: readonly GlyphInfo[] = [
  { name: "Star",      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", image: imgA3f8c21b },
  { name: "Heart",     id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e", image: img7d4e9f06 },
  { name: "Moon",      id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f", image: imgR6j3b5ht },
  { name: "Sun",       id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a", image: imgW1c9g4ms },
  { name: "Butterfly", id: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b", image: imgT8f2l6yn },
  { name: "Flower",    id: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c", image: imgH3q7x0kz },
  { name: "Dove",      id: "a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d", image: imgB5w9r2jp },
  { name: "Rainbow",   id: "b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e", image: imgN7d4v8fc },
  { name: "Bell",      id: "c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f", image: imgG2m6t1xq },
  { name: "Clover",    id: "d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a", image: imgY9k3h5bw },
  { name: "Feather",   id: "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b", image: imgF4p8n0rd },
  { name: "Tree",      id: "f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c", image: imgX1j6c9mt },
  { name: "Mountain",  id: "a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d", image: imgD7v2q4fs },
  { name: "Wave",      id: "b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e", image: imgL3w8g5kn },
  { name: "Candle",    id: "c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f", image: imgS6b1y9hx },
  { name: "Angel",     id: "d6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a", image: imgM0f7t3vp },
  { name: "Cross",     id: "e7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b", image: imgQ5x2d8jc },
  { name: "Infinity",  id: "f8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c", image: imgV4n9k6rw },
] as const;

/** Build a lookup from glyph id → GlyphInfo (includes image). */
const GLYPH_MAP = new Map(ALL_GLYPHS.map((g) => [g.id, g]));

/** Resolve a glyph id (e.g. from the API) to its full info including image. */
export function glyphById(id: string): GlyphInfo | undefined {
  return GLYPH_MAP.get(id);
}

/** Select a random subset of `count` glyphs (for playback verification). */
export function selectRandomGlyphs(count = 9): GlyphInfo[] {
  const shuffled = [...ALL_GLYPHS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
