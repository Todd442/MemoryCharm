const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function postWaitlist(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, source: "landing" }),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Waitlist signup failed: ${res.status}`);
  }
}
