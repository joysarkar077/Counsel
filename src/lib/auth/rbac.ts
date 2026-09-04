/**
 * Dashboard Route Permission Matrix:
 * - /dashboard/admin          -> ['admin']
 * - /dashboard/cases/[id]     -> ['admin', 'lawyer', 'client']
 * - /dashboard/cases/[id]/chat-> ['admin', 'lawyer', 'client']
 * - /dashboard/audit          -> ['admin', 'lawyer']
 * - /dashboard/profile        -> ['admin', 'lawyer', 'client']
 */

import { NextResponse } from 'next/server';

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
      const userId = req.headers.get('x-user-id');
      const userRole = req.headers.get('x-user-role') as Role;

      if (!userId || !userRole) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Inject userId into req for downstream handlers to use
      (req as any).userId = userId;
      (req as any).userRole = userRole;

      const hasPermission = allowedRoles.includes(userRole) || userRole === 'admin' || userRole === 'super_admin';

      if (!hasPermission) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return handler(req, ...args);
    };
  };
}
