import { LogLevel, type Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "ba1dc3e7-4c7b-49c3-b526-dd06fa667a5b",
    authority: "https://MemoryCharms.ciamlogin.com/98a6abae-6060-40da-a43f-f7187cd56710/",
    redirectUri: window.location.origin,
    knownAuthorities: ["MemoryCharms.ciamlogin.com"],
  },
  cache: {
    cacheLocation: "localStorage",
  },
  system: {
    allowRedirectInIframe: false,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error(message);
        else if (level === LogLevel.Warning) console.warn(message);
        else if (level === LogLevel.Info) console.info(message);
        else console.debug(message);
      },
    },
  },
};

// Minimal scopes for sign-in (MSAL automatically adds openid/profile/email)
export const loginRequest = {
  scopes: [],
  prompt: "login",
};
