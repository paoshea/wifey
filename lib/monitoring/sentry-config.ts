'use client';

import { init, Event, SeverityLevel, Transaction } from '@sentry/nextjs';
import { ErrorBoundary, ErrorBoundaryProps } from '@sentry/react';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { ComponentType, ReactNode } from 'react';

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
  replaysOnErrorSampleRate: number;
  replaysSessionSampleRate: number;
  integrations: any[];
  beforeSend: (event: Event) => Event | null;
}

let sentryInitialized = false;

export async function initializeSentry(): Promise<void> {
  if (sentryInitialized) {
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.warn('Sentry DSN not configured');
    return;
  }

  const config: SentryConfig = {
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    integrations: [
      new ProfilingIntegration(),
    ],
    beforeSend(event: Event): Event | null {
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      return event;
    },
  };

  await init(config);
  sentryInitialized = true;
}

const ErrorFallback = ({ error, resetError }: ErrorBoundaryProps) => (
  <div className="error-boundary-fallback" role="alert">
    <h2>Something went wrong</h2>
    <pre>{error.message}</pre>
    <button onClick={resetError} type="button">Try again</button>
  </div>
);

export function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback || <ErrorFallback />}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export async function logError(
  error: Error,
  context?: Record<string, unknown>,
  level: SeverityLevel = 'error'
): Promise<void> {
  const client = await init();
  client.withScope((scope) => {
    scope.setLevel(level);
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    client.captureException(error);
  });
}

interface PerformanceTracker {
  finish: (status?: string) => Promise<void>;
}

export async function trackPerformance(
  name: string,
  data?: Record<string, unknown>
): Promise<PerformanceTracker> {
  const client = await init();
  const transaction = client.startTransaction({
    name,
    op: 'performance',
  });

  return {
    finish: async (status = 'ok'): Promise<void> => {
      if (data) {
        transaction.setData('performance_data', data);
      }
      transaction.setStatus(status);
      transaction.finish();
    },
  };
}

export async function identifyUser(
  id: string,
  email?: string,
  additionalData?: Record<string, unknown>
): Promise<void> {
  const client = await init();
  client.setUser({
    id,
    email,
    ...additionalData,
  });
}

export async function addBreadcrumb(
  message: string,
  category?: string,
  level: SeverityLevel = 'info',
  data?: Record<string, unknown>
): Promise<void> {
  const client = await init();
  client.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now(),
  });
}
