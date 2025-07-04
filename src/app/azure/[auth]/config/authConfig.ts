import { LogLevel, Configuration, PopupRequest } from '@azure/msal-browser';

const getRedirectUrl = (): string => {
  if (typeof window !== 'undefined') {
    const currentUrl = new URL(window.location.href);
    currentUrl.search = '';
    currentUrl.pathname = currentUrl.pathname.replace('/auth', '/authredirect');
    return currentUrl.toString();
  }
  return (
    process.env.NEXT_PUBLIC_REDIRECT_URL || process.env.REACT_APP_REDIRECT_URL || 'http://localhost:8443/en-au/auth'
  );
};

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || ''}`,
    redirectUri: getRedirectUrl(),
    postLogoutRedirectUri: getRedirectUrl(),
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    allowRedirectInIframe: false,
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            if (process.env.NODE_ENV !== 'production') {
              console.info(message);
            }
            return;
          case LogLevel.Verbose:
            if (process.env.NODE_ENV !== 'production') {
              console.debug(message);
            }
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
      piiLoggingEnabled: false,
    },
  },
};

export const loginRequest: PopupRequest = {
  scopes: ['api://bba1a46b-21dfsfsds25-4699-a6f1-7a58ddsds2739a9b/default'],
};
