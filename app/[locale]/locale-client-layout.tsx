'use client';

import { Providers } from './providers';
import { type SupportedLocale } from '@/lib/i18n/config';

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
      {children}
    </Providers>
  );
}
