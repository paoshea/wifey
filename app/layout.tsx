'use client';

import { QueryProvider } from '@/lib/providers/query-provider';
import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/sw/register';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
