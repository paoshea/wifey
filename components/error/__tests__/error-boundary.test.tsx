import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../error-boundary';

interface ThrowErrorProps {
    shouldThrow: boolean;
    message?: string;
}

const ThrowError: React.FC<ThrowErrorProps> = ({ shouldThrow, message = 'Test error' }) => {
    if (shouldThrow) {
        throw new Error(message);
    }
    return <div>No error</div>;
};

const CustomFallback: React.FC = () => <div>Custom error message</div>;

describe('ErrorBoundary', () => {
    let consoleErrorSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;
    const originalNodeEnv = process.env.NODE_ENV;

    // Suppress console logging during tests
    beforeAll(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
        // Restore original environment
        Object.defineProperty(process.env, 'NODE_ENV', {
            value: originalNodeEnv,
            configurable: true
        });
    });

    afterEach(() => {
        consoleErrorSpy.mockClear();
        consoleLogSpy.mockClear();
        Object.defineProperty(process.env, 'NODE_ENV', {
            value: 'test',
            configurable: true
        });
    });

    it('renders children when no error occurs', () => {
        render(
            <ErrorBoundary>
                <div>Test content</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders default fallback UI when error is thrown', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('renders custom fallback component when provided', () => {
        render(
            <ErrorBoundary fallback={<CustomFallback />}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('resets error state when children change', () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        // Rerender with new children
        rerender(
            <ErrorBoundary>
                <div>New content</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('New content')).toBeInTheDocument();
    });

    it('maintains error boundary isolation', () => {
        render(
            <div>
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
                <ErrorBoundary>
                    <div>Still working</div>
                </ErrorBoundary>
            </div>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Still working')).toBeInTheDocument();
    });

    it('handles nested error boundaries correctly', () => {
        render(
            <ErrorBoundary fallback={<div>Outer error</div>}>
                <div>Outer content</div>
                <ErrorBoundary fallback={<div>Inner error</div>}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            </ErrorBoundary>
        );

        expect(screen.getByText('Inner error')).toBeInTheDocument();
        expect(screen.getByText('Outer content')).toBeInTheDocument();
    });

    it('logs errors only in development mode', async () => {
        // Set to development mode
        Object.defineProperty(process.env, 'NODE_ENV', {
            value: 'development',
            configurable: true
        });

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Wait for next tick to ensure error boundary has processed the error
        await Promise.resolve();

        expect(consoleLogSpy).toHaveBeenCalledWith(
            'Error caught by boundary:',
            {
                error: 'Test error',
                componentStack: expect.any(String)
            }
        );

        // Reset to test mode
        Object.defineProperty(process.env, 'NODE_ENV', {
            value: 'test',
            configurable: true
        });
    });

    describe('accessibility', () => {
        it('provides appropriate ARIA attributes for error state', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const errorContainer = screen.getByRole('alert');
            expect(errorContainer).toBeInTheDocument();
            expect(errorContainer).toHaveAttribute('aria-live', 'polite');
        });
    });
});
