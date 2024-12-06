import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@components/error/error-boundary';

// Helper component that throws an error
const ThrowError = ({ message }: { message: string }) => {
    throw new Error(message);
    return null;
};

describe('ErrorBoundary', () => {
    // Spy on console.log before each test
    let consoleLogSpy: jest.SpyInstance;
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        // Mock process.env getter
        jest.spyOn(process, 'env', 'get').mockImplementation(() => ({
            ...process.env,
            NODE_ENV: originalNodeEnv
        }));
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        jest.restoreAllMocks();
    });

    it('renders children when no error occurs', () => {
        render(
            <ErrorBoundary>
                <div>Test Content</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders fallback UI when error is thrown', () => {
        const errorMessage = 'Test error message';

        render(
            <ErrorBoundary>
                <ThrowError message={errorMessage} />
            </ErrorBoundary>
        );

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('logs errors to console in development', () => {
        // Mock process.env for development
        jest.spyOn(process, 'env', 'get').mockImplementation(() => ({
            ...process.env,
            NODE_ENV: 'development'
        }));

        const errorMessage = 'Development error message';

        render(
            <ErrorBoundary>
                <ThrowError message={errorMessage} />
            </ErrorBoundary>
        );

        expect(consoleLogSpy).toHaveBeenCalledWith(
            'Error caught by boundary:',
            expect.objectContaining({
                error: errorMessage,
                componentStack: expect.any(String)
            })
        );
    });

    it('handles multiple errors gracefully', () => {
        const Parent = () => (
            <div>
                <ErrorBoundary>
                    <ThrowError message="Error 1" />
                </ErrorBoundary>
                <ErrorBoundary>
                    <ThrowError message="Error 2" />
                </ErrorBoundary>
            </div>
        );

        render(<Parent />);

        const alerts = screen.getAllByRole('alert');
        expect(alerts).toHaveLength(2);
        expect(screen.getByText('Error 1')).toBeInTheDocument();
        expect(screen.getByText('Error 2')).toBeInTheDocument();
    });

    it('uses custom fallback component when provided', () => {
        const CustomFallback = () => <div>Custom Error UI</div>;

        render(
            <ErrorBoundary fallback={<CustomFallback />}>
                <ThrowError message="Test error" />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('resets error state when children change', () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError message="Initial error" />
            </ErrorBoundary>
        );

        expect(screen.getByText('Initial error')).toBeInTheDocument();

        // Rerender with new children
        rerender(
            <ErrorBoundary>
                <div>New content</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('New content')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
