'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log in development and avoid console.error to prevent test noise
    if (process.env.NODE_ENV === 'development') {
      // Using console.log instead of console.error to reduce test noise
      console.log('Error caught by boundary:', {
        error: error.message,
        componentStack: errorInfo.componentStack
      });
    }
    // Here you could add error reporting service integration
    // e.g., Sentry.captureException(error, { extra: errorInfo });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state if children change
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-red-50 text-red-800"
          role="alert"
          aria-live="polite"
        >
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-red-600">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
