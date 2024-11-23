// Mock Sentry implementation for testing
export const logError = (error: Error | string, context?: any) => {
    // In test environment, just log to console
    console.error('[Mock Sentry]', error, context);
};

export const trackPerformance = (name: string, value: any, properties?: Record<string, any>) => {
    // In test environment, just log to console
    console.log('[Mock Sentry Performance]', { name, value, properties });
};

export const initSentry = () => {
    console.log('[Mock Sentry] Initialized');
};
