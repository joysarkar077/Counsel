import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Convert hex string to ArrayBuffer for subtle crypto
function hexToArrayBuffer(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

async function verifyHmacEdge(secret: string, data: string, expectedHex: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  return bufferToHex(signature) === expectedHex;
}

function decodeBase64Url(base64Url: string) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - base64.length % 4) % 4;
  const padded = base64 + '='.repeat(padLen);
  return JSON.parse(atob(padded));
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session_token');

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isProtectedApi = request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/auth/');

  if (isDashboard || isProtectedApi) {
    if (!sessionCookie?.value) {
      if (isProtectedApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Validate session_token format: header.payload.signature
      const parts = sessionCookie.value.split('.');
      if (parts.length !== 3) throw new Error('Invalid token format');
      
      const [header, payloadStr, signatureHex] = parts;
      
      const serverSecret = process.env.SERVER_SECRET || 'dev-secret-change-in-production';
      const isValid = await verifyHmacEdge(serverSecret, payloadStr, signatureHex);
      
      if (!isValid) throw new Error('Invalid signature');

      const payload = decodeBase64Url(payloadStr);
      
      // Inject user info into headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-role', payload.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (err) {
      console.error('Session validation error:', err);
      if (isProtectedApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ]
};
