'use client';

import { Providers } from './providers';
import { type SupportedLocale } from '@/lib/i18n/config';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

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
    <Providers 
      locale={locale} 
      messages={messages}
      timeZone="America/Los_Angeles"
    >
      <div className="flex min-h-screen flex-col bg-background">
        <Header pathname={pathname} />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
