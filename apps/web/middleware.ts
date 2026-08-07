import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { lazySecret } from './app/lib/secrets';

const SESSION_COOKIE_NAME = 'groupmarket_session';
const resolveJwtSecret = lazySecret('JWT_SECRET', 'groupmarket-insecure-dev-secret');
const jwtKey = () => new TextEncoder().encode(resolveJwtSecret());

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/admin', '/add-group'];

// Routes that should redirect authenticated users to dashboard
const AUTH_ROUTES = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, jwtKey());
      isAuthenticated = true;
    } catch {
      // Token is invalid or expired — treat as unauthenticated
      isAuthenticated = false;
    }
  }

  // If accessing a protected route while not authenticated → redirect to login
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If accessing auth routes while already authenticated → redirect to dashboard
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/add-group/:path*', '/login', '/register'],
};
