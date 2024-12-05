import { Providers } from './providers';
import { OfflineStatusBar } from '@/components/offline/status-bar';
import { OfflineErrorHandler } from '@/components/offline/error-handler';

interface RootLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default function RootLayout({
  children,
  params: { locale }
}: RootLayoutProps) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Providers>
          {/* Error Handler */}
          <OfflineErrorHandler />

          {/* Main Content */}
          <main className="min-h-screen pb-16">
            {children}
          </main>

          {/* Status Bar */}
          <OfflineStatusBar />
        </Providers>

        {/* PWA Support */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
