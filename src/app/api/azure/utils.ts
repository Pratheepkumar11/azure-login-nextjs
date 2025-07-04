import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';

// Azure AD configuration (shared across auth routes)
export const azureConfig = {
  clientId: process.env.AZURE_CLIENT_ID || '',
  tenantId: process.env.AZURE_TENANT_ID || '',
  scopes: [''],
  redirectUri: '', // This will be set dynamically in the route handlers
};

// Cookie names for storing PKCE and state values
const COOKIE_NAMES = {
  PKCE_VERIFIER: 'pkce_verifier',
  AUTH_STATE: 'auth_state',
};

/**
 * Generates a random string for PKCE code verifier
 * @returns A random string of specified length
 */
export function generateCodeVerifier(length = 64): string {
  return randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, length);
}

/**
 * Generates a code challenge from the code verifier using SHA256
 * @param verifier The code verifier
 * @returns The code challenge
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = createHash('sha256').update(verifier).digest('base64');
  return hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Stores PKCE code verifier in a cookie
 * @param verifier The code verifier to store
 */
export async function storePkceVerifier(verifier: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.PKCE_VERIFIER, verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
}

/**
 * Retrieves and clears the stored PKCE code verifier
 * @returns The stored code verifier
 */
export async function retrievePkceVerifier(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const verifier = cookieStore.get(COOKIE_NAMES.PKCE_VERIFIER)?.value;
  if (verifier) {
    cookieStore.delete(COOKIE_NAMES.PKCE_VERIFIER);
  }
  return verifier;
}

/**
 * Stores the authentication state in a cookie
 * @param state The state to store
 */
export async function storeAuthState(state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.AUTH_STATE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
}

/**
 * Retrieves and clears the stored authentication state
 * @returns The stored authentication state
 */
export async function retrieveAuthState(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const state = cookieStore.get(COOKIE_NAMES.AUTH_STATE)?.value;
  if (state) {
    cookieStore.delete(COOKIE_NAMES.AUTH_STATE);
  }
  return state;
}
