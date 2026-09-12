import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://lrqmsmuqfukxtkkvefwt.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_oZ8DAGL5Xfwpe7_YEd8m4Q_E9axr6Ih';

function getSupabaseClient(): SupabaseClient | null {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/^["']|["']$/g, '');
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim().replace(/^["']|["']$/g, '');

  if (!url || !key) {
    return null;
  }

  try {
    return createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err) {
    console.error('[Security] Failed to initialize server Supabase client for auth verification:', err);
    return null;
  }
}

let serverClientInstance: SupabaseClient | null = null;
function getServerSupabase(): SupabaseClient | null {
  if (!serverClientInstance) {
    serverClientInstance = getSupabaseClient();
  }
  return serverClientInstance;
}

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

/**
 * Cryptographically verifies a Supabase Auth JWT token server-side via Supabase auth.getUser(token).
 *
 * CRITICAL SECURITY INVARIANTS:
 * - Never decodes unverified JWT payloads (no Buffer.from base64 decode, no atob).
 * - Never trusts unverified claims from arbitrary tokens.
 * - Never creates synthetic server users from unverified tokens.
 * - Fails fast and returns null if the cryptographic signature is invalid, tampered, or expired.
 */
export async function verifyAuthToken(token: string): Promise<{ uid: string; email?: string; name?: string } | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const cleanToken = token.trim();
  if (!cleanToken) {
    return null;
  }

  const client = getServerSupabase();
  if (!client) {
    console.error('[Security] Server Supabase client is not available for cryptographic token verification.');
    return null;
  }

  try {
    // Official cryptographic verification through Supabase Auth
    const { data, error } = await client.auth.getUser(cleanToken);
    if (error || !data?.user) {
      if (error) {
        console.warn(`[Security] Cryptographic JWT verification failed: ${error.message}`);
      }
      return null;
    }

    return {
      uid: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
    };
  } catch (err: any) {
    console.error('[Security] Unexpected error verifying Supabase JWT:', err?.message || err);
    return null;
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Bearer token is empty' });
  }

  const user = await verifyAuthToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or unverified Supabase authentication token' });
  }

  req.user = user;
  next();
};
