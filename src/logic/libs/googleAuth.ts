/**
 * LIBS/GOOGLEAUTH.TS
 * Implementation for Google OAuth2 (especially for Drive API Access).
 * Requires CLIENT_ID, CLIENT_SECRET, and SCOPES.
 */

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

export const googleAuthConfig = {
  // @ts-ignore
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  redirectUri: `${window.location.origin}/auth/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ].join(' '),
};

/**
 * Triggers the Google Login Popup/Redirect
 */
export const initiateGoogleLogin = () => {
  const params = new URLSearchParams({
    client_id: googleAuthConfig.clientId,
    redirect_uri: googleAuthConfig.redirectUri,
    response_type: 'token', // Using Implicit Flow for client-side easy access
    scope: googleAuthConfig.scopes,
    include_granted_scopes: 'true',
    state: 'pass-through value',
  });

  window.location.href = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
};

/**
 * Helper to extract token from URL after callback
 */
export const handleGoogleCallback = () => {
  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');

  if (accessToken) {
    localStorage.setItem('google_access_token', accessToken);
    if (expiresIn) {
      localStorage.setItem('google_token_expiry', (Date.now() + Number(expiresIn) * 1000).toString());
    }
    return accessToken;
  }
  return null;
};
