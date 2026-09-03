import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isProtectedApi =
      req.nextUrl.pathname.startsWith('/api/') &&
      !req.nextUrl.pathname.startsWith('/api/auth/') &&
      !req.nextUrl.pathname.startsWith('/api/uploadthing');

    if (!token) {
      if (isProtectedApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // If it's an API route that IS explicitly allowed (like auth or uploadthing webhook), let it pass
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Inject user info into headers for API routes
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', token.id as string);
    requestHeaders.set('x-user-role', token.role as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  },
  {
    callbacks: {
      authorized: () => true, // Let the custom middleware function handle authorization
    },
    pages: {
      signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.SERVER_SECRET || 'dev-secret-change-in-production',
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/client/:path*',
    '/lawyer/:path*',
    '/admin/:path*',
    '/api/:path*',
  ]
};
