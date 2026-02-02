type MemoryType = "video" | "image" | "audio";
type AuthMode = "none" | "glyph";

async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function mockLogin(name: string, email: string): Promise<{ ok: true; user: { id: string; name: string; email: string } }> {
  return postJson("/api/auth/mock-login", { name, email });
}

export async function claimCharm(code: string): Promise<{ ok: true; charmId: string; code: string }> {
  return postJson("/api/charm/claim", { code });
}

export async function configureCharm(code: string, memoryType: MemoryType, authMode: AuthMode): Promise<{ ok: true; code: string }> {
  return postJson("/api/charm/configure", { code, memoryType, authMode });
}

export async function uploadCharm(code: string, memoryType: MemoryType, filename: string): Promise<{ ok: true; code: string; memoryType: MemoryType; playbackUrl: string }> {
  return postJson("/api/charm/upload", { code, memoryType, filename });
}
