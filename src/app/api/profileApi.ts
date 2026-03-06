import { authGet, authPost } from "../http/apiClient";

export const CURRENT_TERMS_VERSION = "1.0";
const ULA_CACHE_KEY = "mc.ulaVersion";

export type UserProfile = {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  cellNumber: string;
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
  termsVersion?: string;
  termsAcceptedAt?: string;
};

/**
 * Returns true if the locally cached ULA version matches the current version.
 * Used as a fast-path to skip the API call on subsequent visits.
 */
export function isUlaCachedLocally(): boolean {
  return localStorage.getItem(ULA_CACHE_KEY) === CURRENT_TERMS_VERSION;
}

/** Writes the accepted version to localStorage after a confirmed API acceptance. */
export function cacheUlaLocally(): void {
  localStorage.setItem(ULA_CACHE_KEY, CURRENT_TERMS_VERSION);
}

/**
 * Get user profile. GET /api/user/profile
 * Returns { hasProfile, profile?, termsVersion? } to match existing SPA contract.
 */
export async function getUserMe(): Promise<{
  hasProfile: boolean;
  profile?: UserProfile;
  termsVersion?: string;
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
      termsVersion: res.termsVersion,
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
 * Record terms acceptance. POST /api/user/terms/accept
 * Also writes the accepted version to localStorage as a client-side cache.
 */
export async function acceptTerms(): Promise<void> {
  await authPost("/api/user/terms/accept", { version: CURRENT_TERMS_VERSION });
  cacheUlaLocally();
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
