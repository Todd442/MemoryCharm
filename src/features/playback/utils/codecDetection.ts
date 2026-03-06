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
