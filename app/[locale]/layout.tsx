import { Inter } from 'next/font/google';
import { GeistSans, GeistMono } from 'geist/font';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { locales, type SupportedLocale } from '@/lib/i18n/config';
import { Providers } from './providers';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export type LocaleLayoutProps = {
  children: React.ReactNode;
  params: { locale: SupportedLocale };
};

async function getLocaleMessages(locale: SupportedLocale) {
  try {
    return await getMessages(locale);
  } catch (error) {
    notFound();
  }
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  const messages = await getLocaleMessages(locale);

  if (!locales.includes(locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className={`antialiased bg-background`} suppressHydrationWarning>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}