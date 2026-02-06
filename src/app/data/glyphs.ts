/**
 * Glyph catalog — mirrors Mnemosyne.API/Models/Glyphs/GlyphDefinitions.cs exactly.
 * The order and UUIDs must match the API.
 */

export type GlyphInfo = {
  name: string;
  id: string; // GUID string
};

export const ALL_GLYPHS: readonly GlyphInfo[] = [
  { name: "Star",      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
  { name: "Heart",     id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e" },
  { name: "Moon",      id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f" },
  { name: "Sun",       id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a" },
  { name: "Butterfly", id: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b" },
  { name: "Flower",    id: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c" },
  { name: "Dove",      id: "a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d" },
  { name: "Rainbow",   id: "b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e" },
  { name: "Bell",      id: "c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f" },
  { name: "Clover",    id: "d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a" },
  { name: "Feather",   id: "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b" },
  { name: "Tree",      id: "f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c" },
  { name: "Mountain",  id: "a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d" },
  { name: "Wave",      id: "b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e" },
  { name: "Candle",    id: "c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f" },
  { name: "Angel",     id: "d6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a" },
  { name: "Cross",     id: "e7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b" },
  { name: "Infinity",  id: "f8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c" },
] as const;

/** Select a random subset of `count` glyphs (for playback verification). */
export function selectRandomGlyphs(count = 9): GlyphInfo[] {
  const shuffled = [...ALL_GLYPHS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
