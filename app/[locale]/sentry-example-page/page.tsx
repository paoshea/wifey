'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { ErrorBoundary } from '@sentry/nextjs';

function SentryContent() {
  const t = useTranslations('SentryExample');
  const params = useParams();
  const [count, setCount] = useState(0);

  const throwError = () => {
    throw new Error(t('Frontend Error Message'));
  };

  const throwApiError = async () => {
    const res = await fetch('/api/sentry-test-error', {
      headers: {
        'Accept-Language': params.locale as string
      }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || t('API Error Message'));
    }
  };

  const logMessage = () => {
    const message = t('Test Message');
    Sentry.captureMessage(message);
    console.log(t('Message Sent'));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">{t('Page Title')}</h1>
      
      <div className="space-y-4">
        <button
          onClick={throwError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          {t('Frontend Error Button')}
        </button>

        <button
          onClick={throwApiError}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          {t('API Error Button')}
        </button>

        <button
          onClick={logMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {t('Log Message Button')}
        </button>

        <div className="mt-8">
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {t('Counter')}: {count}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SentryExamplePage() {
  const t = useTranslations('SentryExample');
  return (
    <ErrorBoundary fallback={<div>{t('Error Fallback')}</div>}>
      <SentryContent />
    </ErrorBoundary>
  );
}