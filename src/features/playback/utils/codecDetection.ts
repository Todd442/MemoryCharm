/**
 * Client-side MP4/MOV audio codec detection.
 *
 * Reads only the moov atom (metadata box) — never the full media data.
 * For a typical 200 MB video this reads < 10 KB off disk.
 *
 * Cross-browser: uses Blob.arrayBuffer() with FileReader fallback for
 * Safari < 14.1 / iOS Safari < 14.5.
 */

export type CodecCheckResult =
  | { ok: true }
  | { ok: false; codec: string }
  | { ok: "unknown" }; // detection failed — fail open, never block upload

/**
 * Combined result of inspecting a video file before upload.
 * audioIssue — FourCC of an unsupported audio codec, or undefined if fine.
 * rotation    — non-zero degrees if rotation metadata is baked in (90/180/270),
 *               or undefined if the video is upright / detection failed.
 */
export type VideoInspectResult = {
  audioIssue?: string;
  rotation?: 90 | 180 | 270;
};

/** Audio codec FourCCs that browsers cannot decode. */
const PROBLEMATIC = ["samr", "sawb", "ac-3", "ec-3"];

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function readSlice(source: File | string, start: number, end: number): Promise<ArrayBuffer> {
  if (typeof source === "string") {
    // URL path — use HTTP Range request
    return fetch(source, { headers: { Range: `bytes=${start}-${end - 1}` } })
      .then((r) => r.arrayBuffer());
  }

  // File path — use File.slice() with FileReader fallback
  const slice = source.slice(start, end);
  if ("arrayBuffer" in slice) {
    return (slice as Blob).arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(slice);
  });
}

function fourCC(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}

function sourceSize(source: File | string): number | null {
  return typeof source === "string" ? null : source.size;
}

/**
 * Walk top-level MP4 atoms to find and return the moov box bytes.
 * Reads only 8 bytes per atom until moov is found, then reads moov in full.
 */
async function extractMoov(source: File | string): Promise<ArrayBuffer | null> {
  const size = sourceSize(source);
  const limit = size ?? 200 * 1024 * 1024; // guard for URL-based reads
  let offset = 0;

  while (offset < limit - 8) {
    const header = await readSlice(source, offset, offset + 8);
    const view = new DataView(header);
    const atomSize = view.getUint32(0, false); // big-endian
    const type = fourCC(view, 4);

    if (atomSize < 8) break; // malformed

    if (type === "moov") {
      return readSlice(source, offset, offset + atomSize);
    }

    offset += atomSize;

    // For URL sources without a known file size, stop after a reasonable scan
    if (typeof source === "string" && offset > 32 * 1024 * 1024) break;
  }

  return null;
}

/**
 * Scan moov bytes for known problematic audio codec FourCCs.
 * moov contains only structured metadata — no raw media data — so false
 * positives from these 4-byte sequences are negligible.
 */
function scanMoov(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);

  for (const codec of PROBLEMATIC) {
    const [a, b, c, d] = codec.split("").map((ch) => ch.charCodeAt(0));
    for (let i = 0; i < bytes.length - 3; i++) {
      if (bytes[i] === a && bytes[i + 1] === b && bytes[i + 2] === c && bytes[i + 3] === d) {
        return codec;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check the audio codec of a locally-selected video File before upload.
 * Only inspects MP4 and QuickTime containers — WebM carries Vorbis/Opus
 * which are universally supported, so those pass through unchecked.
 */
export async function checkFileAudioCodec(file: File): Promise<CodecCheckResult> {
  const type = file.type.toLowerCase();
  if (!type.startsWith("video/mp4") && !type.startsWith("video/quicktime")) {
    return { ok: true };
  }

  try {
    const moov = await extractMoov(file);
    if (!moov) return { ok: "unknown" };

    const problematic = scanMoov(moov);
    if (problematic) return { ok: false, codec: problematic };

    return { ok: true };
  } catch {
    return { ok: "unknown" }; // never block on detection failure
  }
}

/**
 * Check the audio codec of an already-uploaded video via its SAS URL,
 * using HTTP Range requests so only the moov box is fetched.
 * Returns "unknown" if range requests aren't supported or the request fails.
 */
export async function checkUrlAudioCodec(url: string): Promise<CodecCheckResult> {
  try {
    // Probe with a tiny range request to confirm range support
    const probe = await fetch(url, { headers: { Range: "bytes=0-7" } });
    if (probe.status !== 206) return { ok: "unknown" };

    const moov = await extractMoov(url);
    if (!moov) return { ok: "unknown" };

    const problematic = scanMoov(moov);
    if (problematic) return { ok: false, codec: problematic };

    return { ok: true };
  } catch {
    return { ok: "unknown" };
  }
}

// ---------------------------------------------------------------------------
// Rotation detection
// ---------------------------------------------------------------------------

/**
 * Scan moov bytes for a tkhd (track header) box and return the rotation
 * encoded in its transformation matrix, or 0 if the matrix is identity /
 * not found.
 *
 * The tkhd matrix uses 16.16 fixed-point values (big-endian).
 * Identity:  a=65536  b=0      c=0      d=65536
 * 90° CW:    a=0      b=65536  c=-65536 d=0
 * 180°:      a=-65536 b=0      c=0      d=-65536
 * 270° CW:   a=0      b=-65536 c=65536  d=0
 */
function detectRotationInMoov(moov: ArrayBuffer): 0 | 90 | 180 | 270 {
  const bytes = new Uint8Array(moov);
  const view = new DataView(moov);

  // Scan for the 'tkhd' FourCC (0x74 0x6B 0x68 0x64)
  for (let i = 4; i < bytes.length - 8; i++) {
    if (
      bytes[i] === 0x74 && bytes[i + 1] === 0x6b &&
      bytes[i + 2] === 0x68 && bytes[i + 3] === 0x64
    ) {
      // i is the start of the FourCC, so the box header starts at i-4
      const boxStart = i - 4;
      const version = bytes[boxStart + 8]; // version byte after size+type

      // Offset to the matrix:
      // +8  (size + type)
      // +4  (version + flags)
      // +20 (v0) or +32 (v1)  time fields
      // +8  (2× reserved uint32)
      // +8  (layer, alternate_group, volume, reserved)
      const matrixStart = boxStart + 8 + 4 + (version === 1 ? 32 : 20) + 8 + 8;

      if (matrixStart + 36 > bytes.length) continue;

      const a = view.getInt32(matrixStart, false);
      const b = view.getInt32(matrixStart + 4, false);
      const c = view.getInt32(matrixStart + 12, false);
      const d = view.getInt32(matrixStart + 16, false);

      if (a === 0 && b > 0 && c < 0 && d === 0) return 90;
      if (a < 0 && b === 0 && c === 0 && d < 0) return 180;
      if (a === 0 && b < 0 && c > 0 && d === 0) return 270;
      // Identity or unrecognised — keep scanning (there may be a video tkhd later)
    }
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Combined pre-upload inspection
// ---------------------------------------------------------------------------

/**
 * Inspect a locally-selected video File for known browser-incompatibilities.
 * Reads only the moov atom — never loads the full media data.
 *
 * Inspects MP4 / QuickTime / M4V containers. WebM passes through unmodified
 * (Vorbis/Opus are universally supported, WebM doesn't carry rotation metadata).
 * Falls back to file extension when the browser reports an empty or generic MIME type.
 *
 * Fails open on any parse error — detection issues never block an upload.
 */
export async function inspectVideoFile(file: File): Promise<VideoInspectResult> {
  const type = file.type.toLowerCase();
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const isMp4Container =
    type.startsWith("video/mp4") ||
    type.startsWith("video/quicktime") ||
    type.startsWith("video/x-m4v") ||
    // Fallback for files where the browser reports an empty or generic MIME type
    (!type || type === "video/mpeg") &&
      (ext === "mp4" || ext === "mov" || ext === "m4v" || ext === "3gp");

  if (!isMp4Container) {
    return {};
  }

  try {
    const moov = await extractMoov(file);
    if (!moov) return {};

    const result: VideoInspectResult = {};

    const badCodec = scanMoov(moov);
    if (badCodec) result.audioIssue = badCodec;

    const rotation = detectRotationInMoov(moov);
    if (rotation !== 0) result.rotation = rotation;

    return result;
  } catch {
    return {}; // never block on detection failure
  }
}
