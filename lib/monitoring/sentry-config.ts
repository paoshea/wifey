'use client';

import * as Sentry from '@sentry/nextjs';
import type { 
  Integration,
  Event,
  EventHint,
  Breadcrumb,
  BreadcrumbHint,
  Span,
  EventProcessor,
  Hub,
  StackFrame,
  Exception,
  User,
  SeverityLevel,
  SpanStatus,
  TransactionContext
} from '@sentry/types';
import type { BrowserClient } from '@sentry/browser';
import {
  init,
  browserTracingIntegration,
  replayIntegration,
  getCurrentHub,
  setUser,
  addBreadcrumb as addSentryBreadcrumb,
  captureException,
  captureMessage,
  startTransaction
} from '@sentry/nextjs';
import { ErrorBoundary } from '@sentry/react';
import type { ErrorBoundaryProps } from '@sentry/react';
import type { FC } from 'react';
import React from 'react';

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
  replaysOnErrorSampleRate: number;
  replaysSessionSampleRate: number;
  debug?: boolean;
  maxBreadcrumbs?: number;
  attachStacktrace?: boolean;
  normalizeDepth?: number;
  autoSessionTracking?: boolean;
  integrations?: ReadonlyArray<Integration>;
}

// Runtime type guard
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

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
    const config: SentryConfig = {
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
    };

    init({
      ...config,
      integrations: [
        {
          name: 'RewriteFrames' as const,
          setupOnce(addGlobalEventProcessor: (eventProcessor: EventProcessor) => void): void {
            const processor = ((event: unknown): Event | null => {
              if (!event || typeof event !== 'object') {
                return null;
              }
              
              const processedEvent = event as Event;
              const frames = processedEvent.exception?.values?.flatMap(
                (exception: Exception) => exception.stacktrace?.frames ?? []
              );
              
              frames?.forEach((frame: StackFrame) => {
                if (frame.filename?.startsWith('app://')) {
                  frame.filename = frame.filename.replace('app://', '~/');
                }
              });
              
              return processedEvent;
            });
            
            addGlobalEventProcessor(processor as EventProcessor);
          },
        } as const,
        browserTracingIntegration({
          traceFetch: true,
          traceXHR: true,
          tracingOrigins: ['localhost', /^\//, /^https?:\/\//] as const,
        } as const),
        replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        } as const),
      ] satisfies readonly Integration[],
      beforeSend(event: Event, hint?: EventHint): Event | null {
        if (process.env.NODE_ENV === 'development') {
          return null;
        }

        const error = hint?.originalException;
        if (isError(error)) {
          const errorMessage = error.message.toLowerCase();
          
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
      beforeBreadcrumb(breadcrumb: Breadcrumb, hint?: BreadcrumbHint): Breadcrumb | null {
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

  const hub: Hub = getCurrentHub();
  const scope = hub.getScope();
  
  if (!scope) return;

  if (context) {
    scope.setExtras(context);
  }
  
  if (typeof error === 'string') {
    scope.setLevel('error');
    scope.addBreadcrumb({
      category: 'error',
      message: error,
      level: 'error',
    });
    hub.captureMessage(error, 'error');
  } else {
    scope.setLevel('error');
    scope.addBreadcrumb({
      category: 'error',
      message: error.message,
      level: 'error',
    });
    hub.captureException(error);
  }
}

// Performance monitoring
interface PerformanceTracker {
  finish: (status?: string) => Promise<void>;
  addData: (data: Record<string, unknown>) => void;
}

export async function trackPerformance(
  name: string,
  data?: Record<string, unknown>
): Promise<PerformanceTracker> {
  if (!sentryInitialized) {
    return {
      finish: async () => {},
      addData: () => {},
    };
  }

  const hub: Hub = getCurrentHub();
  const context: TransactionContext = {
    name,
    op: 'performance',
    description: `Performance tracking for ${name}`
  };

  const transaction = Sentry.startTransaction(context);

  if (!transaction) {
    return {
      finish: async () => {},
      addData: () => {},
    };
  }

  hub.configureScope((scope) => {
    scope.setSpan(transaction);
  });

  const span = transaction.startChild({
    op: name,
    description: `Performance span for ${name}`
  });
  
  if (!span) {
    transaction.finish();
    return {
      finish: async () => {},
      addData: () => {},
    };
  }

  if (data) {
    span.setData('initialData', data);
  }

  return {
    finish: async (status?: SpanStatus) => {
      if (status) {
        span.setStatus(status);
      }
      span.finish();
      transaction.finish();
    },
    addData: (additionalData: Record<string, unknown>) => {
      span.setData('additionalData', additionalData);
    },
  };
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

  setUser({
    id,
    ...(email && { email }),
    ...(additionalData || {}),
  } satisfies User);
}

// Breadcrumb tracking for debugging
export async function addBreadcrumb(
  message: string,
  category?: string,
  level: SeverityLevel = 'info',
  data?: Record<string, unknown>
): Promise<void> {
  if (!sentryInitialized) {
    return;
  }

  addSentryBreadcrumb({
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
  trackPerformance,
  setUserContext,
  addBreadcrumb,
  ErrorBoundary,
  ErrorFallback,
} as const;

// Export types
export type { 
  Integration,
  Event,
  EventHint,
  Breadcrumb,
  BreadcrumbHint,
  Span,
  User,
  SeverityLevel,
  SpanStatus,
  ErrorBoundaryProps 
} from '@sentry/types';
export type { SentryConfig };

// Type export for the singleton
export type SentrySingleton = typeof sentry;
