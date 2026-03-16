import { msalInstance } from "../auth/msalInstance";
import { loginRequest } from "../auth/msalConfig";

export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

const API_SCOPES: string[] = import.meta.env.VITE_API_SCOPE
  ? [import.meta.env.VITE_API_SCOPE as string]
  : [];

async function getBearerToken(): Promise<string> {
  const devToken = import.meta.env.VITE_DEV_TOKEN as string | undefined;
  if (devToken) return devToken;

  const account =
    msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (!account) throw new Error("Not signed in.");

  try {
    const result = await msalInstance.acquireTokenSilent({
      account,
      scopes: API_SCOPES,
    });
    return result.accessToken;
  } catch (e: any) {
    // If the token can't be acquired silently (expired, interaction required,
    // or MSAL interaction lock timed out), save the current path and redirect
    // to re-authenticate rather than surfacing a raw MSAL error in the UI.
    const msg = String(e?.message ?? e?.errorCode ?? "").toLowerCase();
    const needsInteraction =
      e?.name === "InteractionRequiredAuthError" ||
      msg.includes("interaction_required") ||
      msg.includes("login_required") ||
      msg.includes("timed_out") ||
      msg.includes("token_renewal_operationfailed");

    if (needsInteraction) {
      sessionStorage.setItem("mc.returnTo", window.location.pathname);
      await msalInstance.loginRedirect(loginRequest);
      // loginRedirect navigates away — this line is never reached
    }
    throw e;
  }
}

/** Recursively lowercase the first character of each key (PascalCase → camelCase). */
function camelKeys<T>(obj: unknown): T {
  if (obj === null || typeof obj !== "object") return obj as T;
  if (Array.isArray(obj)) return obj.map((item) => camelKeys(item)) as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k[0].toLowerCase() + k.slice(1)] = camelKeys(v);
  }
  return out as T;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      const norm = camelKeys<Record<string, unknown>>(body);
      if (norm?.message) msg = String(norm.message);
    } catch {
      /* not JSON */
    }
    throw new Error(msg);
  }
  const raw = await res.json();
  return camelKeys<T>(raw);
}

// -- Public (no auth) --------------------------------------------------------

export async function publicGet<T>(path: string): Promise<T> {
  const res = await fetch(API_BASE + path, {
    headers: { Accept: "application/json" },
  });
  return handleResponse<T>(res);
}

export async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

/**
 * Like publicGet but returns the raw Response so callers can inspect status codes
 * before deciding how to parse the body (e.g. 404 vs 200).
 */
export async function publicGetRaw(path: string): Promise<Response> {
  return fetch(API_BASE + path, {
    headers: { Accept: "application/json" },
  });
}

/**
 * Like publicPost but returns the raw Response.
 */
export async function publicPostRaw(
  path: string,
  body: unknown
): Promise<Response> {
  return fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
}

// -- Authenticated -----------------------------------------------------------

export async function authGet<T>(path: string): Promise<T> {
  const token = await getBearerToken();
  const res = await fetch(API_BASE + path, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<T>(res);
}

export async function authPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getBearerToken();
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function authPut<T>(path: string, body: unknown): Promise<T> {
  const token = await getBearerToken();
  const res = await fetch(API_BASE + path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

/**
 * Like getBearerToken but returns null instead of throwing when the user
 * is not signed in. Used for optionally-authenticated public endpoints.
 *
 * Does NOT use VITE_DEV_TOKEN — that bypass is tied to a specific user's token
 * and must not bleed onto other signed-in accounts. If a real MSAL account
 * exists we acquire their actual token; if silent acquisition fails we return
 * null (treat as unauthenticated) rather than substituting the wrong identity.
 */
export async function tryGetBearerToken(): Promise<string | null> {
  try {
    const account =
      msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
    if (!account) return null;

    const result = await msalInstance.acquireTokenSilent({
      account,
      scopes: API_SCOPES,
    });
    return result.accessToken;
  } catch {
    return null; // silently fail — caller treats auth as optional
  }
}
