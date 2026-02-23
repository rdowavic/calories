import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Missing authorization token', code: 'UNAUTHORIZED' } });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' } });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const adminEmails = env.ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean);
  if (!req.userEmail || !adminEmails.includes(req.userEmail)) {
    return res.status(403).json({ error: { message: 'Admin access required', code: 'FORBIDDEN' } });
  }
  next();
}
