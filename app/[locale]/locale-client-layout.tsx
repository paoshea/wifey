'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { type SupportedLocale } from 'lib/i18n/config';
import { Header } from 'components/layout/header';
import { Footer } from 'components/layout/footer';
import { NotificationCenter } from 'components/notifications/notification-center';
import { Toaster } from 'components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
});

// Configure React Query client with optimal settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
});

interface LocaleClientLayoutProps {
  children: React.ReactNode;
  locale: SupportedLocale;
  messages: any;
  pathname: string;
}

export default function LocaleClientLayout({
  children,
  locale,
  messages,
  pathname,
}: LocaleClientLayoutProps) {
  return (
    <html lang={locale} className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <NextIntlClientProvider locale={locale} messages={messages} timeZone="America/Los_Angeles">
                <div className="flex min-h-screen flex-col bg-background">
                  <Header />
                  <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                  </main>
                  <Footer />
                  <NotificationCenter />
                  <Toaster />
                  <SonnerToaster
                    position="top-center"
                    richColors
                    closeButton
                    expand
                    duration={4000}
                  />
                </div>
              </NextIntlClientProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
