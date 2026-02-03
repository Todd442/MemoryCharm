import { LogLevel, type Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "ba1dc3e7-4c7b-49c3-b526-dd06fa667a5b",
    authority: "https://MemoryCharms.ciamlogin.com/",
    redirectUri: window.location.origin, // http://localhost:5173
    navigateToLoginRequestUrl: true,
    knownAuthorities: ["MemoryCharms.ciamlogin.com"], // helps prevent authority validation issues for custom domains
  },
  cache: {
    cacheLocation: "sessionStorage", // safer; switch to localStorage if you want SSO across tabs
    storeAuthStateInCookie: false,
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
};
