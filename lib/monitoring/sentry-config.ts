'use client';

import type { 
  Integration,
  Event,
  EventHint,
  Breadcrumb,
  BreadcrumbHint,
  Span,
  EventProcessor,
  StackFrame,
  Exception,
  User,
  SeverityLevel,
  SpanStatus,
  IntegrationFn,
  Scope,
  ErrorEvent,
  SpanAttributes,
  SpanAttributeValue,
} from '@sentry/types';
import type { BrowserClient } from '@sentry/browser';
import {
  init,
  browserTracingIntegration,
  replayIntegration,
  setUser,
  addBreadcrumb as addSentryBreadcrumb,
  captureException,
  captureMessage,
  addEventProcessor,
  getClient,
  withScope,
} from '@sentry/nextjs';
import { startSpan } from '@sentry/core';
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
      integrations: (defaultIntegrations: Integration[]) => {
        const rewriteFrames: Integration = {
          name: 'RewriteFrames' as const,
          setupOnce(): void {
            const eventProcessor = (event: Event): Event | null => {
              if (!event || typeof event !== 'object') {
                return event;
              }
              
              const frames = event.exception?.values?.flatMap(
                (exception) => exception.stacktrace?.frames ?? []
              );
              
              if (frames) {
                frames.forEach((frame) => {
                  if (frame.filename?.startsWith('app://')) {
                    frame.filename = frame.filename.replace('app://', '');
                  }
                });
              }
              
              return event;
            };

            addEventProcessor(eventProcessor);
          }
        };

        return [
          ...defaultIntegrations,
          browserTracingIntegration(),
          replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
          }),
          rewriteFrames,
        ] satisfies Integration[];
      },
      beforeSend(event: Event, hint?: EventHint): ErrorEvent | Promise<ErrorEvent | null> | null {
        if (process.env.NODE_ENV === 'development') {
          return null;
        }

        const error = hint?.originalException;
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          
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

        return event as unknown as ErrorEvent;
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

  withScope(scope => {
    if (context) {
      scope.setExtras(context);
    }
    
    if (typeof error === 'string') {
      captureMessage(error, 'error');
    } else {
      captureException(error);
    }
  });
}

// Performance monitoring
interface PerformanceSpan {
  finish: (status?: SpanStatus) => Promise<void>;
  addData: (data: Record<string, SpanAttributeValue>) => void;
}

export function trackPerformance(
  name: string,
  op: string,
  data?: Record<string, SpanAttributeValue>
): PerformanceSpan {
  if (!sentryInitialized) {
    return {
      finish: async () => {},
      addData: () => {},
    };
  }

  let finishSpan: (() => void) | undefined;
  let setSpanData: ((data: Record<string, SpanAttributeValue>) => void) | undefined;

  startSpan(
    {
      name,
      op,
      attributes: data,
    },
    span => {
      finishSpan = () => span.end();
      setSpanData = (additionalData: Record<string, SpanAttributeValue>) => {
        Object.entries(additionalData).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      };

      withScope(scope => {
        scope.setSDKProcessingMetadata({
          spanId: span.spanContext().spanId,
          traceId: span.spanContext().traceId,
        });
      });
    }
  );

  return {
    finish: async () => {
      if (finishSpan) {
        finishSpan();
      }
    },
    addData: (additionalData: Record<string, SpanAttributeValue>) => {
      if (setSpanData) {
        setSpanData(additionalData);
      }
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

  withScope(scope => {
    setUser({
      id,
      ...(email && { email }),
      ...(additionalData || {}),
    } satisfies User);
  });
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
  Event,
  EventHint,
  Breadcrumb,
  BreadcrumbHint,
  Span,
  EventProcessor,
  StackFrame,
  Exception,
  User,
  SeverityLevel,
  SpanStatus,
  SpanAttributes,
  SpanAttributeValue,
} from '@sentry/types';
export type { BrowserClient } from '@sentry/browser';
export type { SentryConfig };

// Type export for the singleton
export type SentrySingleton = typeof sentry;
