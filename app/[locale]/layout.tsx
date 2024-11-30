'use client';

import { Metadata } from 'next';
import { useLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { locales, type SupportedLocale } from '@/lib/i18n/config';
import { Providers } from './providers';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Wifey - Find Coverage & WiFi',
  description: 'Find cellular coverage points and free WiFi hotspots near you',
};

async function getLocaleMessages(locale: string) {
  try {
    return await getMessages(locale);
  } catch (error) {
    notFound();
  }
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as SupportedLocale)) {
    notFound();
  }

  const messages = await getLocaleMessages(locale);

  return (
    <Providers locale={locale as SupportedLocale} messages={messages}>
      {children}
    </Providers>
  );
}