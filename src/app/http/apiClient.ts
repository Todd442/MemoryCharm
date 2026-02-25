import { msalInstance } from "../auth/msalInstance";

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

  const result = await msalInstance.acquireTokenSilent({
    account,
    scopes: API_SCOPES,
  });
  return result.accessToken;
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
