'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { NextIntlClientProvider } from 'next-intl';
import { Navbar } from '@/components/layout/navbar';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { Toaster } from '@/components/ui/toaster';
import { type SupportedLocale } from '@/lib/i18n/config';

interface ProvidersProps {
  locale: SupportedLocale;
  messages: any;
  children: React.ReactNode;
}

export function Providers({ locale, messages, children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <div className="fixed top-4 right-4 z-50">
              <NotificationCenter />
            </div>
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Toaster />
          </div>
        </NextIntlClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
