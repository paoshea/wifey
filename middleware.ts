import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/verify',
  '/auth/verify-request',
  '/auth/error',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/verify',
  '/onboarding',
  '/api/onboarding',
  '/coverage',
  '/wifi',
  '/explore',
];

// Paths that require specific roles
const roleProtectedPaths = {
  '/api/admin': ['admin'],
  '/api/moderate': ['admin', 'moderator'],
  '/api/coverage/verify': ['admin', 'moderator'],
  '/api/coverage/delete': ['admin', 'moderator'],
};

const locales = ['en', 'es'];

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always'
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public API routes
  if (pathname.startsWith('/api/') && publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Handle internationalization first
  const response = await intlMiddleware(request);
  if (response) return response;

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token and not a public path, redirect to signin
  if (!token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Check if email is verified for protected routes
  if (!token.emailVerified && !pathname.startsWith('/auth/verify')) {
    return NextResponse.redirect(
      new URL('/auth/verify-request', request.url)
    );
  }

  // Check if user needs onboarding
  const hasCompletedOnboarding = request.cookies.get('hasCompletedOnboarding');
  const isOnboardingPage = pathname.includes('/onboarding');

  if (!hasCompletedOnboarding && !isOnboardingPage && !pathname.includes('/_next')) {
    const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';
    return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
  }

  // Check role-protected paths
  for (const [protectedPath, allowedRoles] of Object.entries(roleProtectedPaths)) {
    if (pathname.startsWith(protectedPath)) {
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
