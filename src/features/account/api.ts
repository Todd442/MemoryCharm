import { authGet, authPut } from "../../app/http/apiClient";

// Re-export profile API for convenience
export { getUserMe, saveProfile } from "../../app/api/profileApi";
export type { UserProfile } from "../../app/api/profileApi";

// Re-export upload flow for content re-upload from account page
export { uploadCharm } from "../claim/api";

// -- Types -------------------------------------------------------------------

export type UserCharmSummary = {
  charmId: string;
  nickname: string | null;
  status: string;
  memoryType: string | null;
  authMode: string;
  claimedAt: string;
  configuredAt: string | null;
  firstFinalizedAt: string | null;
  isSettled: boolean;
  charmTier: string | null;
  expiresAt: string | null;
};

export type ContentFile = {
  url: string;
  name: string;
};

export type UserCharmDetail = {
  charmId: string;
  nickname: string | null;
  status: string;
  memoryType: string | null;
  authMode: string;
  claimedAt: string | null;
  configuredAt: string | null;
  firstFinalizedAt: string | null;
  isSettled: boolean;
  settlesAt: string | null;
  canEditContent: boolean;
  charmTier: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  isFading: boolean;
  fadingInDays: number | null;
  files: ContentFile[] | null;
};

type ListUserCharmsApiResponse = {
  count: number;
  charms: UserCharmSummary[];
};

type UpdateGlyphApiResponse = {
  charmId: string;
  authMode: string;
};

// -- API functions -----------------------------------------------------------

/**
 * List all charms owned by the authenticated user.
 */
export async function getUserCharms(): Promise<UserCharmSummary[]> {
  const res = await authGet<ListUserCharmsApiResponse>("/api/user/charms");
  return res.charms;
}

/**
 * Get detailed info about a single charm owned by the authenticated user.
 */
export async function getCharmDetail(code: string): Promise<UserCharmDetail> {
  return authGet<UserCharmDetail>(
    `/api/user/charms/${encodeURIComponent(code)}`
  );
}

/**
 * Update the auth mode and glyph on a charm. No settling restriction.
 */
export async function updateGlyph(
  code: string,
  authMode: "none" | "glyph",
  glyphId?: string
): Promise<{ charmId: string; authMode: string }> {
  const body: Record<string, unknown> = { authMode };
  if (authMode === "glyph" && glyphId) {
    body.glyphId = glyphId;
  }
  return authPut<UpdateGlyphApiResponse>(
    `/api/charm/${encodeURIComponent(code)}/glyph`,
    body
  );
}
