import { msalInstance } from "../../app/auth/msalInstance";

type MemoryType = "video" | "image" | "audio";
type AuthMode = "none" | "glyph";

/**
 * IMPORTANT:
 * For a real protected API, you should request your API scope here, e.g.:
 *   const SCOPES = ["api://<api-app-id>/charm.manage"];
 *
 * For now, leave empty while we wire end-to-end; then we’ll add the scope.
 */
const SCOPES: string[] = [];

async function getBearerToken(): Promise<string> {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (!account) {
    throw new Error("Not signed in.");
  }

  const result = await msalInstance.acquireTokenSilent({
    account,
    scopes: SCOPES,
  });

  return result.accessToken;
}

async function authPostJson<T>(url: string, body: any): Promise<T> {
  const token = await getBearerToken();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function claimCharm(code: string): Promise<{ ok: true; charmId: string; code: string }> {
  return authPostJson("/api/charm/claim", { code });
}

export async function configureCharm(
  code: string,
  memoryType: MemoryType,
  authMode: AuthMode
): Promise<{ ok: true; code: string }> {
  return authPostJson("/api/charm/configure", { code, memoryType, authMode });
}

export async function uploadCharm(
  code: string,
  memoryType: MemoryType,
  filename: string
): Promise<{ ok: true; code: string; memoryType: MemoryType; playbackUrl: string }> {
  return authPostJson("/api/charm/upload", { code, memoryType, filename });
}
