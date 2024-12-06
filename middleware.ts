import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/i18n/config';

export function middleware(request: NextRequest) {
  // Check if there is any supported locale in the pathname
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files and API routes
  if (pathname.includes('.') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check if the pathname starts with a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = defaultLocale;

    // e.g. incoming request is /products
    // The new URL is now /en/products
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname === '/' ? '' : pathname}`,
        request.url
      )
    );
  }
}

export const config = {
  // Match all pathnames except for
  // 1. /api (API routes)
  // 2. /_next (Next.js internals)
  // 3. /static (inside /public)
  // 4. all root files inside /public (e.g. /favicon.ico)
  matcher: ['/((?!api|_next|static|.*\\..*|_vercel|[\\w-]+\\.\\w+).*)']
};
