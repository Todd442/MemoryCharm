import { authPost, authPut } from "../../app/http/apiClient";

// Re-export shared profile API so existing imports don't break
export { getUserMe, saveProfile } from "../../app/api/profileApi";
export type { UserProfile } from "../../app/api/profileApi";

type MemoryType = "video" | "image" | "audio";
type AuthMode = "none" | "glyph";

// -- API response types (from Mnemosyne) ------------------------------------

type ClaimCharmApiResponse = {
  charmId: string;
  status: string;
  claimedAt: string;
};

type ConfigureCharmApiResponse = {
  charmId: string;
  status: string;
  memoryType: string;
  authMode: string;
};

type UploadFileEntryApi = {
  index: number;
  azureUploadUrl: string;
  r2UploadUrl: string | null;
  objectKey: string;
};

type UploadContentApiResponse = {
  files: UploadFileEntryApi[];
  expiresInSeconds: number;
  instructions: string;
};

type FinalizeCharmApiResponse = {
  charmId: string;
  status: string;
  fileCount: number;
};

// -- Exported functions ------------------------------------------------------

/**
 * Claim a charm. POST /api/charm/{code}/claim
 * Treats "already_owned" (409) as success — if you already own it, proceed.
 */
export async function claimCharm(
  code: string
): Promise<{ ok: true; charmId: string; code: string }> {
  try {
    const res = await authPost<ClaimCharmApiResponse>(
      `/api/charm/${encodeURIComponent(code)}/claim`,
      {}
    );
    return { ok: true, charmId: res.charmId, code };
  } catch (err: any) {
    const msg = (err?.message ?? "").toLowerCase();
    if (msg.includes("already own") || msg.includes("already_owned")) {
      return { ok: true, charmId: code, code };
    }
    throw err;
  }
}

/**
 * Configure a charm. PUT /api/charm/{code}/configure
 * glyphId is required when authMode === "glyph".
 */
export async function configureCharm(
  code: string,
  memoryType: MemoryType,
  authMode: AuthMode,
  glyphId?: string
): Promise<{ ok: true; code: string }> {
  const body: Record<string, unknown> = { memoryType, authMode };
  if (authMode === "glyph" && glyphId) {
    body.glyphId = glyphId;
  }

  await authPut<ConfigureCharmApiResponse>(
    `/api/charm/${encodeURIComponent(code)}/configure`,
    body
  );
  return { ok: true, code };
}

/**
 * Get signed upload URLs for charm content.
 * fileCount > 1 is only valid for image memory types.
 */
export async function getUploadUrls(
  code: string,
  contentType: string,
  fileCount: number = 1
): Promise<UploadContentApiResponse> {
  return authPost<UploadContentApiResponse>(
    `/api/charm/${encodeURIComponent(code)}/content`,
    { contentType, fileCount }
  );
}

/**
 * Finalize a charm after content upload. POST /api/charm/{code}/finalize
 * Verifies blobs exist and sets status to "active".
 */
export async function finalizeCharm(
  code: string
): Promise<FinalizeCharmApiResponse> {
  return authPost<FinalizeCharmApiResponse>(
    `/api/charm/${encodeURIComponent(code)}/finalize`,
    {}
  );
}

/**
 * Upload a file to a signed URL (Azure Blob or R2).
 */
export function uploadToSignedUrl(
  url: string,
  file: File,
  contentType: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(file);
  });
}

/**
 * In dev mode, rewrite an Azurite signed URL to go through the Vite proxy
 * at /azurite, avoiding CORS issues (browser → Vite → Azurite).
 */
function proxyAzuriteUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `/azurite${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

/**
 * Full upload flow: get signed URLs for N files, upload all in parallel,
 * then finalize the charm (sets status to "active").
 *
 * In dev mode (VITE_DEV_TOKEN set), proxies Azure through Vite and skips R2.
 */
export async function uploadCharm(
  code: string,
  files: File[],
  contentType: string,
  onProgress?: (pct: number) => void
): Promise<{ ok: true; code: string }> {
  const urlsResponse = await getUploadUrls(code, contentType, files.length);
  const isDev = !!import.meta.env.VITE_DEV_TOKEN;

  // Track per-file progress and aggregate
  const fileProgress = new Array(files.length).fill(0);
  const reportProgress = (fileIdx: number) => (pct: number) => {
    fileProgress[fileIdx] = pct;
    if (onProgress) {
      const total = fileProgress.reduce((a, b) => a + b, 0) / files.length;
      onProgress(total);
    }
  };

  // Upload all files in parallel
  const uploads = urlsResponse.files.map((entry, i) => {
    const file = files[i];
    if (isDev) {
      const proxiedUrl = proxyAzuriteUrl(entry.azureUploadUrl);
      return uploadToSignedUrl(proxiedUrl, file, contentType, reportProgress(i));
    } else {
      const azureUpload = uploadToSignedUrl(
        entry.azureUploadUrl, file, contentType, reportProgress(i)
      );
      const r2Upload = entry.r2UploadUrl
        ? uploadToSignedUrl(entry.r2UploadUrl, file, contentType)
        : Promise.resolve();
      return Promise.all([azureUpload, r2Upload]);
    }
  });

  await Promise.all(uploads);

  // Finalize: verify blobs exist and set status to "active"
  await finalizeCharm(code);

  return { ok: true, code };
}

