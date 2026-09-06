import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabaseServer = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

export async function verifyAuthToken(token: string): Promise<{ uid: string; email?: string; name?: string } | null> {
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer.auth.getUser(token);
      if (!error && data?.user) {
        return {
          uid: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        };
      }
    } catch {
      // fallback to jwt decode
    }
  }

  // Parse standard Supabase JWT payload as fallback
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      if (payload && (payload.sub || payload.email)) {
        return {
          uid: payload.sub,
          email: payload.email,
          name: payload.user_metadata?.full_name || payload.user_metadata?.name,
        };
      }
    }
  } catch {
    // invalid token
  }

  return null;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  const user = await verifyAuthToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Supabase token' });
  }

  req.user = user;
  next();
};
