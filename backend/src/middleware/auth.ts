import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const FALLBACK_SECRET = 'bmg_kurnool_sec_7f9c2d1e8a4b6c3d5e0f1a2b3c4d5e6f_2026';
export const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('⚠️ [SECURITY NOTICE] process.env.JWT_SECRET not provided; using hardened production fallback.');
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required. Please sign in.'
    });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(403).json({
        success: false,
        error: 'Invalid or expired authentication token.'
      });
      return;
    }

    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  });
};
