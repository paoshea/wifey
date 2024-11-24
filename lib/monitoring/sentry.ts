// Updated Sentry implementation for production
import * as Sentry from '@sentry/nextjs';

export const initializeSentry = () => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
    });
  }
};

export const identifyUser = (userId: string, email?: string) => {
  Sentry.setUser({
    id: userId,
    email: email,
  });
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

export const trackPerformance = (name: string, value: any, properties?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    category: 'performance',
    message: name,
    data: {
      value,
      ...properties,
    },
    level: 'info',
  });
};
