import { Request, Response } from 'express';
import { googleAuthSchema } from '@calories/shared';
import { verifyGoogleToken, exchangeCodeForToken, findOrCreateUser, generateJWT } from '../services/auth.service';
import { logger } from '../config/logger';
import { z } from 'zod';

export async function googleSignIn(req: Request, res: Response) {
  try {
    const parsed = googleAuthSchema.parse(req.body);

    let googleData;

    if (parsed.idToken) {
      // Direct ID token flow (native Google Sign-In)
      googleData = await verifyGoogleToken(parsed.idToken);
    } else if (parsed.code) {
      // Authorization code flow (expo-auth-session PKCE)
      googleData = await exchangeCodeForToken(
        parsed.code,
        parsed.codeVerifier,
        parsed.redirectUri
      );
    } else {
      return res.status(400).json({
        error: { message: 'Either idToken or code must be provided', code: 'VALIDATION_ERROR' },
      });
    }

    const { user, isNewUser } = await findOrCreateUser(googleData);
    const token = generateJWT(user.id, user.email);

    res.status(200).json({
      data: {
        token,
        user,
        is_new_user: isNewUser,
      },
    });
  } catch (err: any) {
    logger.error({ err }, 'Google sign-in failed');

    if (err.status === 401) {
      return res.status(401).json({
        error: { message: err.message, code: 'UNAUTHORIZED' },
      });
    }

    if (err.name === 'ZodError') {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: err.flatten().fieldErrors,
        },
      });
    }

    res.status(500).json({
      error: { message: 'Authentication failed', code: 'AUTH_ERROR' },
    });
  }
}

const devSignInSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

/**
 * Dev-only sign-in endpoint.
 * Creates or returns a user by email without Google OAuth.
 * Only registered when NODE_ENV !== 'production'.
 */
export async function devSignIn(req: Request, res: Response) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: { message: 'Not found' } });
    }

    const { email, name } = devSignInSchema.parse(req.body);

    const googleData = {
      google_id: `dev_${email}`,
      email,
      name: name || email.split('@')[0],
      picture: null,
    };

    const { user, isNewUser } = await findOrCreateUser(googleData);
    const token = generateJWT(user.id, user.email);

    logger.info({ userId: user.id, email }, 'Dev sign-in');

    res.status(200).json({
      data: {
        token,
        user,
        is_new_user: isNewUser,
      },
    });
  } catch (err: any) {
    logger.error({ err }, 'Dev sign-in failed');

    if (err.name === 'ZodError') {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: err.flatten().fieldErrors,
        },
      });
    }

    res.status(500).json({
      error: { message: 'Authentication failed', code: 'AUTH_ERROR' },
    });
  }
}
