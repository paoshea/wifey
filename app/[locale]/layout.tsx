import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { locales, type SupportedLocale } from '@/lib/i18n/config';
import { headers } from 'next/headers';
import { Inter } from 'next/font/google';
import LocaleClientLayout from './locale-client-layout';
import '../globals.css';
import 'leaflet/dist/leaflet.css';

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
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '/';

  return (
    <html lang={locale} className={`${inter.variable} font-sans antialiased`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-background">
        <LocaleClientLayout locale={locale as SupportedLocale} messages={messages}>
          {children}
        </LocaleClientLayout>
      </body>
    </html>
  );
}
