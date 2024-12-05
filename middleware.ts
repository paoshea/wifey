import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/i18n/config';

// Create internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

// Regex for matching API routes
const API_PATTERN = /^\/api\//;
// Regex for Next.js internal routes and static files
const INTERNAL_PATTERN = /^(?:\/(_next|static|favicon\.ico|manifest\.json|robots\.txt|.*\.(?:jpg|png|gif|ico|svg|css|js|json)))(?:\/|$)/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for Next.js internal routes and static files
  if (INTERNAL_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  // Handle API routes
  if (API_PATTERN.test(pathname)) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Add CORS headers for actual requests
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  // Handle internationalization for all other routes
  return intlMiddleware(request);
}

// Configure middleware matching
export const config = {
  // Match all paths except static files and some Next.js internals
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all other routes except Next.js internal paths and static files
    '/((?!_next|static|favicon\.ico|manifest\.json|robots\.txt|.*\\..*).*)']
};
