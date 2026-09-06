import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from './auth.ts';
import { verifyAdminStatus } from '../db/adminQueries.ts';

export interface AdminAuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
  admin?: {
    uid: string;
    email: string;
    role: string;
    name?: string;
  };
}

/**
 * Strict server-side authorization middleware for SaleTrack Admin API routes.
 *
 * Verifies:
 * 1. Valid cryptographic Supabase Auth token.
 * 2. Active admin role in server database table `admin_users` or designated owner address.
 * 3. Never checks email substring 'admin'.
 * 4. Blocks all normal customer accounts with 403 Forbidden.
 */
export const requireAdmin = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication token required to access admin services.',
    });
  }

  const token = authHeader.split('Bearer ')[1];
  const user = await verifyAuthToken(token);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid authentication session.',
    });
  }

  req.user = user;
  const email = user.email || '';
  const uid = user.uid || '';

  const authCheck = await verifyAdminStatus(uid, email);

  if (!authCheck.isAdmin) {
    console.warn(`[Security Alert] Unauthorized access attempt to /admin API by: ${email} (${uid})`);
    return res.status(403).json({
      error: 'Forbidden: Access denied. You do not possess authorized administrator credentials.',
    });
  }

  req.admin = {
    uid,
    email,
    role: authCheck.role,
    name: authCheck.name,
  };

  next();
};
