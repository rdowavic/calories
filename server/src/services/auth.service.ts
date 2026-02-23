import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { env } from '../config/env';
import { db } from '../config/database';
import { logger } from '../config/logger';
import { User } from '@calories/shared';

const client = new OAuth2Client();

const VALID_CLIENT_IDS = [
  env.GOOGLE_CLIENT_ID_WEB,
  env.GOOGLE_CLIENT_ID_IOS,
  env.GOOGLE_CLIENT_ID_ANDROID,
].filter(Boolean);

interface GoogleUserData {
  google_id: string;
  email: string;
  name: string;
  picture: string | null;
}

/**
 * Verify a Google ID token directly.
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleUserData> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: VALID_CLIENT_IDS,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw Object.assign(new Error('Invalid Google token: no payload'), { status: 401 });
  }

  if (!payload.email || !payload.email_verified) {
    throw Object.assign(new Error('Google account email not verified'), { status: 401 });
  }

  return {
    google_id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture || null,
  };
}

/**
 * Exchange a Google authorization code for an ID token, then verify it.
 * Used by the mobile app's expo-auth-session PKCE flow.
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier?: string,
  redirectUri?: string
): Promise<GoogleUserData> {
  const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: env.GOOGLE_CLIENT_ID_WEB,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  const idToken = tokenResponse.data.id_token;
  if (!idToken) {
    throw Object.assign(new Error('No ID token in Google token response'), { status: 401 });
  }

  return verifyGoogleToken(idToken);
}

export function generateJWT(userId: string, email: string): string {
  return jwt.sign({ userId, email }, env.JWT_SECRET, {
    expiresIn: '30d',
  });
}

export async function findOrCreateUser(
  googleData: GoogleUserData
): Promise<{ user: User; isNewUser: boolean }> {
  const existing = await db('users')
    .where({ google_id: googleData.google_id })
    .first();

  if (existing) {
    logger.debug({ userId: existing.id }, 'Existing user signed in');
    return { user: existing, isNewUser: false };
  }

  const [user] = await db('users')
    .insert({
      google_id: googleData.google_id,
      email: googleData.email,
      display_name: googleData.name,
      avatar_url: googleData.picture,
    })
    .returning('*');

  logger.info({ userId: user.id, email: user.email }, 'New user created');
  return { user, isNewUser: true };
}
