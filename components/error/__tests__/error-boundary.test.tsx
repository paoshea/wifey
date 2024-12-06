import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../error-boundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
};

// Custom fallback component for testing
const CustomFallback = () => <div>Custom error message</div>;

describe('ErrorBoundary', () => {
    // Spy on console.error to prevent error logging during tests
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    // Store original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;

    beforeAll(() => {
        // Use Object.defineProperty to mock NODE_ENV
        Object.defineProperty(process.env, 'NODE_ENV', {
            value: 'test',
            configurable: true
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
        // Restore NODE_ENV
        Object.defineProperty(process.env, 'NODE_ENV', {
            value: originalNodeEnv,
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

    it('renders fallback UI when error is thrown', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText(/An unexpected error occurred|Test error/)).toBeInTheDocument();
    });

    it('logs errors to console in development', () => {
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

        expect(consoleErrorSpy).toHaveBeenCalled();

        // Reset to test mode
        Object.defineProperty(process.env, 'NODE_ENV', {
            value: 'test',
            configurable: true
        });
    });

    it('handles multiple errors gracefully', () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        // Rerender with a different error
        rerender(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('uses custom fallback component when provided', () => {
        render(
            <ErrorBoundary fallback={<CustomFallback />}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom error message')).toBeInTheDocument();
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

    it('preserves error message from thrown error', () => {
        const CustomError = () => {
            throw new Error('Custom error message');
        };

        render(
            <ErrorBoundary>
                <CustomError />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom error message')).toBeInTheDocument();
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

    it('resets error state when children change', () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        rerender(
            <ErrorBoundary>
                <div>New content</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('New content')).toBeInTheDocument();
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
