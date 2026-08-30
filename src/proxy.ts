import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // 1. Get the session token from cookies
  const sessionCookie = request.cookies.get('session_token');

  // 2. Check if the user is trying to access a protected route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    
    // If no session token is found, redirect to the login page
    if (!sessionCookie?.value) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // TODO(Farjana): Add cryptographic JWT verification and HMAC integrity 
    // checks here to ensure the session_token hasn't been tampered with.
    // Also extract the user's role and implement RBAC logic for /admin paths.
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware only to specific routes
  matcher: [
    '/dashboard/:path*',
    // '/api/cases/:path*', // Optional: Protect API routes at edge
    // '/api/messages/:path*'
  ]
};
