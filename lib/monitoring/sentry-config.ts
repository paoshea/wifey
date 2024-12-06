'use client';

import * as Sentry from '@sentry/nextjs';
import { ErrorBoundary } from '@sentry/react';
import type { FC } from 'react';
import React from 'react';

let sentryInitialized = false;
const isBrowser = typeof window !== 'undefined';

// Initialize Sentry with advanced configuration
export async function initializeSentry(): Promise<void> {
  if (sentryInitialized || !isBrowser) {
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.warn('Sentry DSN not configured');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      debug: process.env.NODE_ENV === 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      maxBreadcrumbs: 100,
      attachStacktrace: true,
      normalizeDepth: 10,
      autoSessionTracking: true,
      beforeSend(event) {
        if (process.env.NODE_ENV === 'development') {
          return null;
        }

        const error = event.exception?.values?.[0]?.value;
        if (error && typeof error === 'string') {
          const errorMessage = error.toLowerCase();

          // Filter out common network-related errors
          if (
            errorMessage.includes('network request failed') ||
            errorMessage.includes('load failed') ||
            errorMessage.includes('aborted') ||
            errorMessage.includes('cancelled')
          ) {
            return null;
          }
        }

        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
          const url = breadcrumb.data?.url;
          if (typeof url === 'string' && (
            url.includes('/health') ||
            url.includes('/ping') ||
            url.includes('/metrics')
          )) {
            return null;
          }
        }
        return breadcrumb;
      },
      ignoreErrors: [
        'Non-Error exception captured',
        'Non-Error promise rejection captured',
        /^Network request failed$/i,
        /^Loading chunk \d+ failed$/i,
        /^Loading CSS chunk \d+ failed$/i,
      ],
    });

    sentryInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

// Error boundary component
interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
}

export const ErrorFallback: FC<ErrorFallbackProps> = ({ error, resetError }) => {
  if (!error) return null;

  return React.createElement(
    'div',
    { className: 'error-boundary' },
    React.createElement(
      'div',
      { className: 'error-content' },
      React.createElement('h2', null, 'Something went wrong'),
      React.createElement('pre', null, error.message),
      resetError && React.createElement(
        'button',
        {
          onClick: resetError,
          className: 'retry-button',
          type: 'button'
        },
        'Try again'
      )
    )
  );
};

// Error logging with context
export async function logError(
  error: Error | string,
  context?: Record<string, unknown>
): Promise<void> {
  if (!sentryInitialized) {
    console.error('Sentry not initialized:', error);
    return;
  }

  Sentry.withScope(scope => {
    if (context) {
      scope.setExtras(context);
    }

    if (typeof error === 'string') {
      Sentry.captureMessage(error, 'error');
    } else {
      Sentry.captureException(error);
    }
  });
}

// User identification and context
export async function setUserContext(
  id: string,
  email?: string,
  additionalData?: Record<string, unknown>
): Promise<void> {
  if (!sentryInitialized) {
    return;
  }

  Sentry.setUser({
    id,
    ...(email && { email }),
    ...(additionalData || {}),
  });
}

// Breadcrumb tracking for debugging
export async function addBreadcrumb(
  message: string,
  category?: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, unknown>
): Promise<void> {
  if (!sentryInitialized) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000, // Sentry expects seconds, not milliseconds
  });
}

// Export singleton instance with proper types
export const sentry = {
  init: initializeSentry,
  logError,
  setUserContext,
  addBreadcrumb,
  ErrorBoundary,
  ErrorFallback,
} as const;

export type SentrySingleton = typeof sentry;
