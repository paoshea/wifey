import * as Sentry from '@sentry/nextjs';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Replay } from '@sentry/replay';

export function initializeSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      integrations: [
        new ProfilingIntegration(),
        new Replay({
          // Capture rage clicks, errors, and slow page loads
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      beforeSend(event) {
        // Don't send events in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      },
    });
  }
}

// Custom error boundary component
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <Sentry.ErrorBoundary fallback={fallback || <DefaultErrorFallback />}>
        <Component {...props} />
      </Sentry.ErrorBoundary>
    );
  };
}

// Default error fallback component
function DefaultErrorFallback() {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
      <p className="text-red-600">
        We've been notified and are working to fix the issue.
      </p>
    </div>
  );
}

// Custom error logger
export function logError(
  error: Error,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'error'
) {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

// Performance monitoring
export function trackPerformance(name: string, data?: Record<string, any>) {
  const transaction = Sentry.startTransaction({
    name,
    op: 'performance',
  });

  return {
    finish: (status: string = 'ok') => {
      if (data) {
        transaction.setData('performance_data', data);
      }
      transaction.setStatus(status);
      transaction.finish();
    },
  };
}

// User tracking
export function identifyUser(
  id: string,
  email?: string,
  additionalData?: Record<string, any>
) {
  Sentry.setUser({
    id,
    email,
    ...additionalData,
  });
}

// Custom breadcrumb logger
export function addBreadcrumb(
  message: string,
  category?: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}
