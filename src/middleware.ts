import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isProtectedApi =
      req.nextUrl.pathname.startsWith('/api/') &&
      !req.nextUrl.pathname.startsWith('/api/auth/') &&
      !req.nextUrl.pathname.startsWith('/api/test-decrypt') &&
      !req.nextUrl.pathname.startsWith('/api/uploadthing') &&
      !req.nextUrl.pathname.startsWith('/api/test-avatar');

    if (!token) {
      if (req.nextUrl.pathname === '/') {
        return NextResponse.next();
      }
      if (isProtectedApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // If it's an API route that IS explicitly allowed (like auth or uploadthing webhook), let it pass
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = token.role as string;
    const path = req.nextUrl.pathname;

    if (path === '/' || path === '/dashboard' || path === '/dashboard/') {
      if (role === 'admin' || role === 'super_admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      if (role === 'client') {
        return NextResponse.redirect(new URL('/client/dashboard', req.url));
      }
      if (role === 'lawyer') {
        return NextResponse.redirect(new URL('/lawyer/dashboard', req.url));
      }
    }

    // Role-based route protection
    if (path.startsWith('/admin') && role !== 'admin' && role !== 'super_admin') {
      const target = role === 'client' ? '/client/dashboard' : '/lawyer/dashboard';
      return NextResponse.redirect(new URL(target, req.url));
    }
    if (path.startsWith('/client') && role !== 'client') {
      const target = (role === 'admin' || role === 'super_admin') ? '/admin/dashboard' : '/lawyer/dashboard';
      return NextResponse.redirect(new URL(target, req.url));
    }
    if (path.startsWith('/lawyer') && role !== 'lawyer') {
      const target = (role === 'admin' || role === 'super_admin') ? '/admin/dashboard' : '/client/dashboard';
      return NextResponse.redirect(new URL(target, req.url));
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
    '/',
    '/dashboard/:path*',
    '/client/:path*',
    '/lawyer/:path*',
    '/admin/:path*',
    '/api/:path*',
  ]
};
