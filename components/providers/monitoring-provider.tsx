'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { initializeSentry, identifyUser as identifySentryUser, trackError as trackSentryError } from '@/lib/monitoring/sentry';
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

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export function MonitoringProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize monitoring services
    useEffect(() => {
        initializeSentry();
        initializeAnalytics();
    }, []);

    // Identify user across monitoring services when session changes
    useEffect(() => {
        if (session?.user?.id) {
            const email = session.user.email || undefined; 
            identifySentryUser(session.user.id, email);
            identifyAnalyticsUser(session.user.id, {
                email: session.user.email || undefined,
                name: session.user.name || undefined
            });
        }
    }, [session]);

    // Track page views
    usePageTracking();

    const value = {
        trackEvent,
        startPerformanceMark: performanceMonitor.startMark.bind(performanceMonitor),
        endPerformanceMark: performanceMonitor.endMark.bind(performanceMonitor),
        trackError: trackSentryError
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
