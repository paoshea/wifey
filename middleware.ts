import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/i18n/config';
import { getToken } from 'next-auth/jwt';

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/onboarding',
  '/wifi-finder',
  '/coverage-finder',
  '/map',
  '/leaderboard',
  '/' // Allow access to landing page
];

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/report'
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files and API routes
  if (pathname.includes('.') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check if the pathname starts with a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Get locale from pathname or use default
  const pathnameLocale = pathnameIsMissingLocale ? defaultLocale : pathname.split('/')[1];

  // Handle locale redirect if missing
  if (pathnameIsMissingLocale) {
    return NextResponse.redirect(
      new URL(
        `/${defaultLocale}${pathname === '/' ? '' : pathname}`,
        request.url
      )
    );
  }

  // Remove locale from pathname for route checking
  const pathnameWithoutLocale = pathname.replace(`/${pathnameLocale}`, '');

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathnameWithoutLocale === route || pathnameWithoutLocale === '/'
  );

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathnameWithoutLocale.startsWith(route)
  );

  // Get authentication token
  const token = await getToken({ req: request });

  // Allow access to public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Redirect to sign in if accessing protected route without authentication
  if (isProtectedRoute && !token) {
    const signInUrl = new URL(`/${pathnameLocale}/auth/signin`, request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Allow access to all other routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
