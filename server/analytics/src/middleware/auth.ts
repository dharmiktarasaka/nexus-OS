import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { repository } from '../db/repository.js';

const JWT_SECRETS = [
  process.env.JWT_SECRET || 'stratiq_enterprise_secret_2026',
  process.env.STRATIQ_JWT_SECRET || 'stratiq-jwt-secret-2026',
  process.env.CENTRAL_JWT_SECRET || 'super_secret_central_saas_platform_key_2026'
];

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    name?: string;
    mobileNumber?: string;
    yearlyRevenue?: string;
    picture?: string;
  };
}

export function generateToken(payload: { uid: string; email: string; name?: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRETS[0]).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { uid: string; email: string; name?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    for (const secret of JWT_SECRETS) {
      const expectedSignature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
      if (signature === expectedSignature) {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
        if (payload.exp && Date.now() > payload.exp) return null;
        return {
          uid: String(payload.uid || payload.id || payload.sub),
          email: payload.email || '',
          name: payload.name || payload.displayName
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  // 1. Strictly verify Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();

    const decoded = verifyToken(token);
    if (decoded && decoded.uid) {
      const dbUser = await repository.getUserByUid(decoded.uid);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        name: dbUser?.displayName || decoded.name || 'Executive User',
        mobileNumber: dbUser?.mobileNumber,
        yearlyRevenue: dbUser?.yearlyRevenue,
        picture: dbUser?.photoURL
      };
      return next();
    }
  }

  res.status(401).json({
    success: false,
    error: 'Authentication required. Please sign in with a valid verified session.'
  });
}
