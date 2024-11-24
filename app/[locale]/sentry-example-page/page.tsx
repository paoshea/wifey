'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useTranslations } from 'next-intl';
import { ErrorBoundary } from '@sentry/nextjs';

function SentryContent() {
  const t = useTranslations('SentryExample');
  const [count, setCount] = useState(0);

  const throwError = () => {
    throw new Error('Sentry Frontend Test Error');
  };

  const throwApiError = async () => {
    const res = await fetch('/api/sentry-test-error');
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
  };

  const logMessage = () => {
    Sentry.captureMessage('Test message from Sentry example page');
    console.log('Message sent to Sentry!');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">{t('Sentry Example Page')}</h1>
      
      <div className="space-y-4">
        <button
          onClick={throwError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          {t('Throw Frontend Error')}
        </button>

        <button
          onClick={throwApiError}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          {t('Throw API Error')}
        </button>

        <button
          onClick={logMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {t('Log Test Message')}
        </button>

        <div className="mt-8">
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {t('Count')}: {count}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SentryExamplePage() {
  return (
    <ErrorBoundary fallback={<div>Error occurred! Check Sentry for details.</div>}>
      <SentryContent />
    </ErrorBoundary>
  );
}