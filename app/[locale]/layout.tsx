import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { locales, type SupportedLocale } from 'lib/i18n/config';
import { headers } from 'next/headers';
import { Inter } from 'next/font/google';
import LocaleClientLayout from './locale-client-layout';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'Wifey - Find Coverage & WiFi',
  description: 'Find cellular coverage points and free WiFi hotspots near you',
};

async function getLocaleMessages(locale: string) {
  try {
    return await getMessages({ locale });
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
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '/';

  return (
    <LocaleClientLayout
      messages={messages}
      locale={locale as SupportedLocale}
      pathname={pathname}
    >
      {children}
    </LocaleClientLayout>
  );
}
