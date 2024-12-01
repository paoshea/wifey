'use client';

import { Providers } from './providers';
import { type SupportedLocale } from '@/lib/i18n/config';
import { Header } from '@/components/layout/header';

interface LocaleClientLayoutProps {
  children: React.ReactNode;
  locale: SupportedLocale;
  messages: any;
}

export default function LocaleClientLayout({
  children,
  locale,
  messages,
}: LocaleClientLayoutProps) {
  return (
    <Providers 
      locale={locale} 
      messages={messages}
      timeZone="America/Los_Angeles"
    >
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </Providers>
  );
}
