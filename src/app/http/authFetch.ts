import { msalInstance } from "../../app/auth/msalInstance";

// TODO: once you create an API scope, put it here e.g. ["api://<api-client-id>/Charmed.Manage"]
const DEFAULT_SCOPES: string[] = [];

async function getBearerToken(): Promise<string> {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (!account) throw new Error("No signed-in account.");

  const result = await msalInstance.acquireTokenSilent({
    account,
    scopes: DEFAULT_SCOPES,
  });

  return result.accessToken;
}

export async function authPostJson<T>(url: string, body: any): Promise<T> {
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

export async function authGetJson<T>(url: string): Promise<T> {
  const token = await getBearerToken();

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
