import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary';

// Mock console.log to prevent noise in test output
const originalConsoleLog = console.log;
beforeEach(() => {
    console.log = jest.fn();
});
afterEach(() => {
    console.log = originalConsoleLog;
});

describe('ErrorBoundary', () => {
    const ThrowError = ({ message }: { message: string }) => {
        throw new Error(message);
    };

    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <div>Test Content</div>
            </ErrorBoundary>
        );
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders default error UI when there is an error', () => {
        const errorMessage = 'Test error';
        render(
            <ErrorBoundary>
                <ThrowError message={errorMessage} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('renders custom fallback when provided and error occurs', () => {
        const fallback = <div>Custom Error UI</div>;
        render(
            <ErrorBoundary fallback={fallback}>
                <ThrowError message="Test error" />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    });

    it('resets error state when children change', () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError message="Test error" />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        rerender(
            <ErrorBoundary>
                <div>New Content</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('New Content')).toBeInTheDocument();
    });

    it('logs error in development environment', () => {
        // Mock process.env.NODE_ENV check
        const originalProcessEnv = { ...process.env };
        jest.spyOn(process, 'env', 'get').mockReturnValue({ ...process.env, NODE_ENV: 'development' });

        render(
            <ErrorBoundary>
                <ThrowError message="Test error" />
            </ErrorBoundary>
        );

        expect(console.log).toHaveBeenCalledWith(
            'Error caught by boundary:',
            expect.objectContaining({
                error: 'Test error',
                componentStack: expect.any(String)
            })
        );

        // Restore original process.env
        jest.spyOn(process, 'env', 'get').mockReturnValue(originalProcessEnv);
    });
});
