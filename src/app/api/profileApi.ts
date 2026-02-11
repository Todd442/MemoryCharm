import { authGet, authPost } from "../http/apiClient";

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
};

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
