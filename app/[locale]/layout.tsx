import { Inter } from 'next/font/google';
import { GeistSans, GeistMono } from 'geist/font';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SessionProvider } from 'next-auth/react';
import { Navbar } from '@/components/layout/navbar';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { locales, type SupportedLocale } from '@/lib/i18n/config';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: 'Wifey - Find Coverage & WiFi',
  description: 'Find cellular coverage points and free WiFi hotspots near you',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/logo.svg',
    },
  },
};

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: { locale: SupportedLocale };
};

export default async function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  let messages;
  try {
    messages = await getMessages({ locale });
  } catch (error) {
    notFound();
  }

  // Validate locale
  if (!locales.includes(locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className={`antialiased bg-background`} suppressHydrationWarning>
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
      </body>
    </html>
  );
}