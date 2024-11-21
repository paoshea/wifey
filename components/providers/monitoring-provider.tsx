'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { initializeSentry, identifyUser as identifySentryUser } from '@/lib/monitoring/sentry';
import { 
    initializeAnalytics, 
    identifyUser as identifyAnalyticsUser,
    usePageTracking,
    trackEvent 
} from '@/lib/monitoring/analytics';
import { performanceMonitor } from '@/lib/monitoring/performance';

interface MonitoringContextType {
    trackEvent: (eventName: string, properties?: Record<string, any>) => void;
    startPerformanceMark: (name: string) => void;
    endPerformanceMark: (name: string, properties?: Record<string, any>) => void;
    trackError: (error: Error, context?: Record<string, any>) => void;
}

const MonitoringContext = createContext<MonitoringContextType | null>(null);

export function MonitoringProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize monitoring services
    useEffect(() => {
        initializeSentry();
        initializeAnalytics();
    }, []);

    // Track page views
    usePageTracking();

    // Identify user when session changes
    useEffect(() => {
        if (session?.user) {
            const { id, email, name } = session.user;
            identifySentryUser(id, email);
            identifyAnalyticsUser(id, { email, name });
        }
    }, [session]);

    // Track route changes for performance
    useEffect(() => {
        if (pathname) {
            performanceMonitor.startMark('route_change');
            return () => {
                performanceMonitor.endMark('route_change', {
                    pathname,
                    params: searchParams?.toString()
                });
            };
        }
    }, [pathname, searchParams]);

    // Monitor client-side errors
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            trackEvent('client_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.toString(),
            });
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            trackEvent('unhandled_promise_rejection', {
                reason: event.reason?.toString(),
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    // Monitor network status
    useEffect(() => {
        const handleOnline = () => trackEvent('network_status_change', { status: 'online' });
        const handleOffline = () => trackEvent('network_status_change', { status: 'offline' });

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Monitor memory usage
    useEffect(() => {
        const memoryInterval = setInterval(() => {
            if (performance.memory) {
                trackEvent('memory_usage', {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                });
            }
        }, 60000); // Check every minute

        return () => clearInterval(memoryInterval);
    }, []);

    const value = {
        trackEvent,
        startPerformanceMark: (name: string) => performanceMonitor.startMark(name),
        endPerformanceMark: (name: string, properties?: Record<string, any>) => 
            performanceMonitor.endMark(name, properties),
        trackError: (error: Error, context?: Record<string, any>) => {
            trackEvent('error', {
                message: error.message,
                stack: error.stack,
                ...context,
            });
        },
    };

    return (
        <MonitoringContext.Provider value={value}>
            {children}
        </MonitoringContext.Provider>
    );
}

export function useMonitoring() {
    const context = useContext(MonitoringContext);
    if (!context) {
        throw new Error('useMonitoring must be used within a MonitoringProvider');
    }
    return context;
}
