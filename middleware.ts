import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from 'lib/i18n/config';

// Paths that don't require authentication
const publicPaths = [
  '/signin',
  '/register',
  '/verify',
  '/verify-request',
  '/error',
  '/api/auth',
  '/api/trpc',
  '/api/healthcheck',
];

// Paths that require specific roles
const roleProtectedPaths = {
  '/api/admin': ['admin'],
  '/api/moderate': ['admin', 'moderator'],
  '/api/coverage/verify': ['admin', 'moderator'],
  '/api/coverage/delete': ['admin', 'moderator'],
};

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = publicPaths.some(path =>
    pathname.includes(path) ||
    pathname === '/' ||
    pathname.match(/^\/[a-z]{2}(?:-[A-Z]{2})?$/)  // matches locale paths like /en or /en-US
  );

  // Skip middleware for public API routes and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/api/auth') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Handle internationalization first
  const intlResponse = await intlMiddleware(request);
  if (intlResponse) return intlResponse;

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token and not a public path, redirect to signin
  if (!token && !isPublicPath) {
    const locale = request.cookies.get('NEXT_LOCALE')?.value || defaultLocale;
    const url = new URL(`/${locale}/signin`, request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Check if email is verified for protected routes
  // Only check if token exists and we're not already on a verify path
  if (token && !token.emailVerified && !pathname.startsWith('/verify')) {
    return NextResponse.redirect(
      new URL('/verify-request', request.url)
    );
  }

  // Check if user needs onboarding
  const hasCompletedOnboarding = request.cookies.get('hasCompletedOnboarding');
  const isOnboardingPage = pathname.includes('/onboarding');

  if (!hasCompletedOnboarding && !isOnboardingPage && !pathname.includes('/_next')) {
    const locale = request.cookies.get('NEXT_LOCALE')?.value || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
  }

  // Check role-protected paths
  for (const [protectedPath, allowedRoles] of Object.entries(roleProtectedPaths)) {
    if (pathname.startsWith(protectedPath)) {
      // Only check roles if token exists
      if (!token) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      }
      const userRole = token.role as string;
      if (!allowedRoles.includes(userRole)) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'insufficient_permissions' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
