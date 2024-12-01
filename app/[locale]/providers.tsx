'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { NextIntlClientProvider } from 'next-intl';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { Toaster } from '@/components/ui/toaster';
import { type SupportedLocale } from '@/lib/i18n/config';
import { Toaster as SonnerToaster } from 'sonner';

interface ProvidersProps {
  locale: SupportedLocale;
  messages: any;
  children: React.ReactNode;
  timeZone: string;
}

export function Providers({ locale, messages, children, timeZone }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
          <div className="relative min-h-screen flex flex-col">
            {children}
            <NotificationCenter />
            <Toaster />
            <SonnerToaster position="top-center" richColors />
          </div>
        </NextIntlClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
