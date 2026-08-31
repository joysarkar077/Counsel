/**
 * Dashboard Route Permission Matrix:
 * - /dashboard/admin          -> ['admin']
 * - /dashboard/cases/[id]     -> ['admin', 'lawyer', 'client']
 * - /dashboard/cases/[id]/chat-> ['admin', 'lawyer', 'client']
 * - /dashboard/audit          -> ['admin', 'lawyer']
 * - /dashboard/profile        -> ['admin', 'lawyer', 'client']
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { hmacSha256 } from '@/lib/crypto/hmac';

export type Role = 'client' | 'lawyer' | 'admin' | 'super_admin';

/**
 * Expected Session/JWT Shape:
 * {
 *   userId: string;
 *   role: Role;
 *   iat: number;
 *   exp: number;
 *   signature: string; // ECDSA signature for integrity
 * }
 */

export function requireRole(allowedRoles: Role[]) {
  return (handler: Function) => {
    return async (req: Request, ...args: any[]) => {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('session_token')?.value;

      if (!sessionToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      let userRole: Role;

      try {
        const parts = sessionToken.split('.');
        if (parts.length !== 3) throw new Error('Invalid token format');
        
        const [header, payloadStr, signature] = parts;
        
        // Verify signature (Sabid will change this to ECDSA later)
        const serverSecret = process.env.SERVER_SECRET || 'dev-secret-change-in-production';
        const expectedSignature = hmacSha256(
          Buffer.from(serverSecret, 'utf-8'),
          Buffer.from(payloadStr, 'utf-8')
        ).toString('hex');
        
        if (signature !== expectedSignature) {
          throw new Error('Invalid signature');
        }

        const decodedPayloadStr = Buffer.from(payloadStr, 'base64url').toString('utf-8');
        const payload = JSON.parse(decodedPayloadStr);
        
        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          throw new Error('Token expired');
        }

        userRole = payload.role as Role;
        // Inject userId into req for downstream handlers to use
        (req as any).userId = payload.userId;
      } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!userRole) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const hasPermission = allowedRoles.includes(userRole) || userRole === 'admin' || userRole === 'super_admin';

      if (!hasPermission) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return handler(req, ...args);
    };
  };
}
