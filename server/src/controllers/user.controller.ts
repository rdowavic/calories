import { Response } from 'express';
import { onboardingSchema, userPreferencesSchema } from '@calories/shared';
import { AuthRequest } from '../middleware/auth';
import * as userService from '../services/user.service';
import { logger } from '../config/logger';

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await userService.getUserById(req.userId!);

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', code: 'NOT_FOUND' },
      });
    }

    res.status(200).json({ data: user });
  } catch (err: any) {
    logger.error({ err, userId: req.userId }, 'Failed to get user');
    res.status(500).json({
      error: { message: 'Failed to retrieve user', code: 'SERVER_ERROR' },
    });
  }
}

export async function updateMe(req: AuthRequest, res: Response) {
  try {
    const user = await userService.updateUser(req.userId!, req.body);

    res.status(200).json({ data: user });
  } catch (err: any) {
    logger.error({ err, userId: req.userId }, 'Failed to update user');

    if (err.status === 404) {
      return res.status(404).json({
        error: { message: err.message, code: 'NOT_FOUND' },
      });
    }

    res.status(500).json({
      error: { message: 'Failed to update user', code: 'SERVER_ERROR' },
    });
  }
}

export async function completeOnboarding(req: AuthRequest, res: Response) {
  try {
    const data = onboardingSchema.parse(req.body);
    const result = await userService.completeOnboarding(req.userId!, data);

    res.status(200).json({
      data: {
        user: result.user,
        tdee: result.tdee,
        recommended_calories: result.recommended_calories,
      },
    });
  } catch (err: any) {
    logger.error({ err, userId: req.userId }, 'Failed to complete onboarding');

    if (err.name === 'ZodError') {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: err.flatten().fieldErrors,
        },
      });
    }

    if (err.status === 404) {
      return res.status(404).json({
        error: { message: err.message, code: 'NOT_FOUND' },
      });
    }

    res.status(500).json({
      error: { message: 'Failed to complete onboarding', code: 'SERVER_ERROR' },
    });
  }
}

export async function updatePreferences(req: AuthRequest, res: Response) {
  try {
    const prefs = userPreferencesSchema.parse(req.body);
    const user = await userService.updatePreferences(req.userId!, prefs);

    res.status(200).json({ data: user });
  } catch (err: any) {
    logger.error({ err, userId: req.userId }, 'Failed to update preferences');

    if (err.name === 'ZodError') {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: err.flatten().fieldErrors,
        },
      });
    }

    if (err.status === 404) {
      return res.status(404).json({
        error: { message: err.message, code: 'NOT_FOUND' },
      });
    }

    res.status(500).json({
      error: { message: 'Failed to update preferences', code: 'SERVER_ERROR' },
    });
  }
}
