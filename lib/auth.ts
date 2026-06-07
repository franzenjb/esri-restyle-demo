// Esri named-user OAuth (read-only). Used ONLY by the Red Cross demos.
// Public RAPT never touches this module.
//
// Flow: popup OAuth against arcgis.com with PKCE. The popup lands on
// /oauth-callback.html, which relays the auth response to this window via the
// CustomEvents the IdentityManager listens for.
//
// Red Cross is SAML SSO — only the OAuth redirect flow works. The OAuth app's
// registered redirect URI is https://*.jbf.com/oauth-callback.html, so sign-in
// succeeds only on a *.jbf.com host (not localhost / *.vercel.app).

import OAuthInfo from "@arcgis/core/identity/OAuthInfo.js";
import esriId from "@arcgis/core/identity/IdentityManager.js";

const PORTAL = "https://www.arcgis.com";
const SHARING = `${PORTAL}/sharing`;

// Public OAuth client id (not a secret — it is sent to the browser). Override
// per-deployment with NEXT_PUBLIC_ARCGIS_OAUTH_CLIENT_ID; falls back to the
// shared *.jbf.com wildcard app so RC demos work once deployed to *.jbf.com.
const CLIENT_ID =
  process.env.NEXT_PUBLIC_ARCGIS_OAUTH_CLIENT_ID || "NOYP9RCgBYrcjtRC";

let registered = false;

function ensureRegistered() {
  if (registered) return;
  const info = new OAuthInfo({
    appId: CLIENT_ID,
    portalUrl: PORTAL,
    popup: true,
    popupCallbackUrl: `${window.location.origin}/oauth-callback.html`,
  });
  esriId.registerOAuthInfos([info]);
  registered = true;
}

export async function isSignedIn(): Promise<boolean> {
  ensureRegistered();
  try {
    await esriId.checkSignInStatus(SHARING);
    return true;
  } catch {
    return false;
  }
}

export async function signIn(): Promise<void> {
  ensureRegistered();
  await esriId.getCredential(SHARING, { oAuthPopupConfirmation: false });
}

export function signOut(): void {
  esriId.destroyCredentials();
}

export { CLIENT_ID };
