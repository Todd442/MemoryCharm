export type MemoryType = "video" | "image" | "audio";
export type EntryAuthMode = "none" | "glyph";

export type EntryResponse =
  | { kind: "not_found" }
  | { kind: "expired" }
  | { kind: "unclaimed"; code: string }
  | { kind: "claimed"; code: string; configured: boolean; authMode: EntryAuthMode; memoryType?: MemoryType; attemptsLeft?: number };

export type PlaybackUrlResponse = {
  playbackUrl: string;
  memoryType: MemoryType;
};
