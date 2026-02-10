export type MemoryType = "video" | "image" | "audio";
export type EntryAuthMode = "none" | "glyph";

export type ContentFile = {
  url: string;
  name: string;
};

export type EntryResponse =
  | { kind: "not_found" }
  | { kind: "expired" }
  | { kind: "unclaimed"; code: string }
  | { kind: "claimed"; code: string; configured: boolean; authMode: EntryAuthMode; memoryType?: MemoryType; attemptsLeft?: number; glyphs?: { id: string; name: string }[] };

export type PlaybackUrlResponse = {
  files: ContentFile[];
  memoryType: MemoryType;
};
