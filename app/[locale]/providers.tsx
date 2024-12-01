'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { Toaster } from '@/components/ui/toaster';
import { type SupportedLocale } from '@/lib/i18n/config';
import { Toaster as SonnerToaster } from 'sonner';

// Configure React Query client with optimal settings for our use case
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 2, // Retry failed requests twice
      refetchOnReconnect: 'always', // Always refetch on reconnect for real-time data
    },
    mutations: {
      retry: 1, // Retry failed mutations once
    },
  },
});

interface ProvidersProps {
  locale: SupportedLocale;
  messages: Record<string, any>; // Type for translations dictionary
  children: React.ReactNode;
  timeZone: string;
}

export function Providers({ locale, messages, children, timeZone }: ProvidersProps) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
            <div className="relative min-h-screen flex flex-col">
              {children}
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
  );
}
