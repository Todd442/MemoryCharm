import { msalInstance } from "./msalInstance";

export async function getAccessToken(scopes: string[] = []) {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (!account) throw new Error("No active account.");

  const result = await msalInstance.acquireTokenSilent({
    account,
    scopes,
  });

  return result.accessToken;
}
