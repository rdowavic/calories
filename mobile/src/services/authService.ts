import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import { api } from './api';
import { useAuthStore } from '../stores/authStore';
import { useUserProfileStore } from '../stores/userProfileStore';
import { AuthResponse } from '@calories/shared';

// Complete any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

// Configure is a no-op — kept for API compatibility with _layout.tsx
export function configureGoogleSignIn() {
  // No configuration needed for expo-auth-session
}

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

/**
 * Check if running in Expo Go (store client).
 * Google OAuth doesn't work in Expo Go because Expo Go can't register
 * custom URI schemes, and Google requires HTTPS redirect URIs that
 * resolve to a domain you own.
 */
function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/**
 * Get the redirect URI for Google OAuth (only used in dev builds, not Expo Go).
 */
function getGoogleRedirectUri(): string {
  return AuthSession.makeRedirectUri({ scheme: 'calories' });
}

/**
 * Generate a random hex string.
 */
function generateRandom(length: number): string {
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

/**
 * Generate PKCE code challenge from verifier.
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Sign in using the dev-only endpoint (for Expo Go during development).
 * Skips Google OAuth entirely — signs in with a test email.
 */
export async function devSignIn(email?: string): Promise<AuthResponse> {
  const devEmail = email || 'rachel.dowavic@gmail.com';

  console.log('[Auth] Dev sign-in with email:', devEmail);

  const response = await api.post<{ data: AuthResponse }>('/auth/dev-signin', {
    email: devEmail,
  });

  const authData = response.data.data;

  await useAuthStore.getState().setAuth(authData.user, authData.token);
  useUserProfileStore.getState().setProfile(authData.user);

  return authData;
}

/**
 * Sign in with Google OAuth (for development builds / production).
 * Uses authorization code flow with PKCE.
 *
 * Returns { code, codeVerifier } on success, or null if cancelled.
 */
export async function signInWithGoogle(): Promise<{
  code: string;
  codeVerifier: string;
} | null> {
  const redirectUri = getGoogleRedirectUri();
  const state = generateRandom(20);
  const codeVerifier = generateRandom(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  console.log('[Auth] Redirect URI:', redirectUri);

  const params = new URLSearchParams({
    client_id: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
  });

  const googleAuthUrl = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;

  const result = await WebBrowser.openAuthSessionAsync(googleAuthUrl, redirectUri);

  if (result.type !== 'success' || !('url' in result)) {
    console.log('[Auth] Auth session result:', result.type);
    return null;
  }

  console.log('[Auth] Response URL:', result.url);

  let responseParams: Record<string, string | undefined> = {};

  try {
    const parsed = Linking.parse(result.url);
    responseParams = (parsed.queryParams || {}) as Record<string, string | undefined>;
  } catch {
    const queryStart = result.url.indexOf('?');
    if (queryStart !== -1) {
      const searchParams = new URLSearchParams(result.url.slice(queryStart));
      searchParams.forEach((value, key) => {
        responseParams[key] = value;
      });
    }
  }

  const code = responseParams.code;
  const returnedState = responseParams.state;
  const error = responseParams.error;

  if (error) {
    throw new Error(`Google auth error: ${error}`);
  }

  if (returnedState !== state) {
    console.warn('[Auth] State mismatch:', { expected: state, got: returnedState });
    throw new Error('State mismatch — possible CSRF attack');
  }

  if (!code) {
    throw new Error('No authorization code received from Google');
  }

  return { code, codeVerifier };
}

/**
 * Exchange the authorization code for tokens and authenticate with our server.
 */
export async function handleGoogleAuthCode(
  code: string,
  codeVerifier: string
): Promise<AuthResponse> {
  const redirectUri = getGoogleRedirectUri();

  const response = await api.post<{ data: AuthResponse }>('/auth/google', {
    code,
    codeVerifier,
    redirectUri,
  });

  const authData = response.data.data;

  await useAuthStore.getState().setAuth(authData.user, authData.token);
  useUserProfileStore.getState().setProfile(authData.user);

  return authData;
}

/**
 * Convenience method: checks if we're in Expo Go and should use dev sign-in.
 */
export { isExpoGo };

export async function signOut() {
  await useAuthStore.getState().clearAuth();
  useUserProfileStore.getState().clear();
}

export async function restoreSession(): Promise<boolean> {
  const token = await useAuthStore.getState().loadToken();
  if (!token) return false;

  try {
    const response = await api.get('/users/me');
    const user = response.data.data;
    useAuthStore.getState().setUser(user);
    useUserProfileStore.getState().setProfile(user);
    return true;
  } catch {
    await useAuthStore.getState().clearAuth();
    return false;
  }
}
