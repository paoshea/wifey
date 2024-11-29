import { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import ClientProviders from '@/components/ClientProviders';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/navbar';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Navbar />
            <div className="fixed top-4 right-4 z-50">
              <NotificationCenter />
            </div>
            <main className="container mx-auto px-4 py-8">
              <ClientProviders>{children}</ClientProviders>
            </main>
          </div>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
