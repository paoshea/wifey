'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { logError } from '@/lib/monitoring/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, {
      errorInfo,
      component: 'ErrorBoundary',
    });
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We apologize for the inconvenience. An unexpected error has occurred.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 p-4 rounded-lg overflow-auto">
                  <p className="font-mono text-sm text-red-600">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button
                variant="outline"
                onClick={this.handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error state component for UI components
interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, onRetry, className = '' }: ErrorStateProps) {
  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error</h3>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : error}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="flex items-center gap-2 mx-auto"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Loading error state component
interface LoadingErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function LoadingError({ message = 'Failed to load data', onRetry }: LoadingErrorProps) {
  return (
    <div className="p-4 bg-red-50 rounded-lg">
      <div className="flex items-center gap-2 text-red-600 mb-2">
        <AlertTriangle className="w-5 h-5" />
        <p className="font-medium">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-red-600 hover:text-red-700"
        >
          Try again
        </Button>
      )}
    </div>
  );
}

// Form error message component
interface FormErrorProps {
  error: string | string[];
}

export function FormError({ error }: FormErrorProps) {
  const errors = Array.isArray(error) ? error : [error];
  
  return (
    <div className="text-sm text-red-500 mt-1">
      {errors.map((err, index) => (
        <div key={index} className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          <span>{err}</span>
        </div>
      ))}
    </div>
  );
}

// Inline error message component
interface InlineErrorProps {
  message: string;
}

export function InlineError({ message }: InlineErrorProps) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-red-500">
      <AlertTriangle className="w-3 h-3" />
      {message}
    </span>
  );
}
