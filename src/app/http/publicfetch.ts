const FUNCTION_KEY = import.meta.env.VITE_FUNC_KEY_PUBLIC as string; // put in .env.local

export async function publicGetJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "x-functions-key": FUNCTION_KEY,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function publicPostJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-functions-key": FUNCTION_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
