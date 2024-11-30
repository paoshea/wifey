import { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './[locale]/providers';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Wifey - Find Coverage & WiFi',
  description: 'Find cellular coverage points and free WiFi hotspots near you',
  keywords: ['wifi', 'cellular coverage', 'network coverage', 'free wifi', 'hotspots'],
  authors: [{ name: 'Wifey Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans antialiased`}>
      <body>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
