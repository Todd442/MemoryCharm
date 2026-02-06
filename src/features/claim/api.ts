import { authGet, authPost, authPut } from "../../app/http/apiClient";

type MemoryType = "video" | "image" | "audio";
type AuthMode = "none" | "glyph";

export type UserProfile = {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  cellNumber: string;
};

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

type UploadContentApiResponse = {
  azureUploadUrl: string;
  r2UploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
  instructions: string;
};

type UserProfileApiResponse = {
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  cellNumber?: string;
  displayName?: string;
  totalCharmsOwned: number;
  createdAt: string;
  lastLoginAt?: string;
};

// -- Exported functions ------------------------------------------------------

/**
 * Claim a charm. POST /api/charm/{code}/claim
 */
export async function claimCharm(
  code: string
): Promise<{ ok: true; charmId: string; code: string }> {
  const res = await authPost<ClaimCharmApiResponse>(
    `/api/charm/${encodeURIComponent(code)}/claim`,
    {}
  );
  return { ok: true, charmId: res.charmId, code };
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
 */
export async function getUploadUrls(
  code: string,
  contentType: string
): Promise<UploadContentApiResponse> {
  return authPost<UploadContentApiResponse>(
    `/api/charm/${encodeURIComponent(code)}/content`,
    { contentType }
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
 * Full upload flow: get signed URLs, then upload file to both destinations.
 */
export async function uploadCharm(
  code: string,
  file: File,
  contentType: string,
  onProgress?: (pct: number) => void
): Promise<{ ok: true; code: string }> {
  const urls = await getUploadUrls(code, contentType);

  await Promise.all([
    uploadToSignedUrl(urls.azureUploadUrl, file, contentType, onProgress),
    uploadToSignedUrl(urls.r2UploadUrl, file, contentType),
  ]);

  return { ok: true, code };
}

/**
 * Get user profile. GET /api/user/profile
 * Returns { hasProfile, profile? } to match existing SPA contract.
 */
export async function getUserMe(): Promise<{
  hasProfile: boolean;
  profile?: UserProfile;
}> {
  try {
    const res = await authGet<UserProfileApiResponse>("/api/user/profile");
    return {
      hasProfile: true,
      profile: {
        firstName: res.firstName,
        lastName: res.lastName,
        address: res.address ?? "",
        email: res.email,
        cellNumber: res.cellNumber ?? "",
      },
    };
  } catch (err: any) {
    const msg = (err?.message ?? "").toLowerCase();
    if (msg.includes("404") || msg.includes("not found") || msg.includes("not_found")) {
      return { hasProfile: false };
    }
    throw err;
  }
}

/**
 * Save user profile. POST /api/user/profile
 */
export async function saveProfile(
  profile: UserProfile
): Promise<{ ok: boolean; profile: UserProfile }> {
  const res = await authPost<UserProfileApiResponse>(
    "/api/user/profile",
    profile
  );
  return {
    ok: true,
    profile: {
      firstName: res.firstName,
      lastName: res.lastName,
      address: res.address ?? "",
      email: res.email,
      cellNumber: res.cellNumber ?? "",
    },
  };
}
