'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Analytics state
let isEnabled = false;
const analyticsQueue: Array<{
    type: 'event' | 'performance' | 'error';
    name: string;
    data?: Record<string, any>;
    timestamp: number;
}> = [];

// Initialize analytics
export function initializeAnalytics() {
    if (typeof window === 'undefined') return;
    
    const storedPreference = localStorage.getItem('analytics_enabled');
    isEnabled = storedPreference === 'true';
    
    // Process any queued events
    if (isEnabled) {
        processQueue();
    }
}

// Hook for tracking page views
export function usePageTracking() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!isEnabled) return;

        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
        trackEvent('page_view', { url, path: pathname });
    }, [pathname, searchParams]);
}

// User identification
export function identifyUser(userId: string, properties?: Record<string, any>) {
    if (!isEnabled) return;
    trackEvent('identify_user', { userId, ...properties });
}

// Custom event tracking
export function trackEvent(
    eventName: string,
    properties?: Record<string, any>,
    options?: {
        timestamp?: Date;
        sendInstantly?: boolean;
    }
) {
    if (!isEnabled && !options?.sendInstantly) return;

    const event = {
        type: 'event' as const,
        name: eventName,
        data: properties,
        timestamp: options?.timestamp?.getTime() || Date.now(),
    };

    if (options?.sendInstantly) {
        sendToAnalyticsServer(event);
    } else {
        analyticsQueue.push(event);
        if (analyticsQueue.length >= 10) {
            processQueue();
        }
    }
}

// Performance tracking
export function trackPerformance(
    metricName: string,
    duration: number,
    properties?: Record<string, any>
) {
    if (!isEnabled) return;

    const event = {
        type: 'performance' as const,
        name: metricName,
        data: {
            duration,
            ...properties,
        },
        timestamp: Date.now(),
    };

    analyticsQueue.push(event);
    if (analyticsQueue.length >= 5) {
        processQueue();
    }
}

// User behavior tracking
export const userBehaviorEvents = {
    // Coverage related events
    MARK_COVERAGE: 'mark_coverage_spot',
    UPDATE_COVERAGE: 'update_coverage',
    VIEW_COVERAGE: 'view_coverage_map',
    
    // Achievement related events
    UNLOCK_ACHIEVEMENT: 'unlock_achievement',
    VIEW_ACHIEVEMENTS: 'view_achievements',
    
    // Social events
    SHARE_MAP: 'share_map',
    INVITE_USER: 'invite_user',
    
    // App usage events
    APP_OPEN: 'app_open',
    APP_BACKGROUND: 'app_background',
    APP_FOREGROUND: 'app_foreground',
} as const;

// Feature usage tracking
export function trackFeatureUsage(
    featureName: string,
    properties?: Record<string, any>
) {
    trackEvent('feature_usage', {
        feature: featureName,
        ...properties,
    });
}

// Error tracking
export function trackError(
    error: Error,
    context?: Record<string, any>
) {
    if (!isEnabled) return;

    const event = {
        type: 'error' as const,
        name: error.name,
        data: {
            message: error.message,
            stack: error.stack,
            ...context,
        },
        timestamp: Date.now(),
    };

    // Always send errors immediately
    sendToAnalyticsServer(event);
}

// User session tracking
export function startUserSession(
    userId: string,
    sessionProperties?: Record<string, any>
) {
    if (!isEnabled) return;
    
    trackEvent('session_start', {
        userId,
        startTime: Date.now(),
        ...sessionProperties,
    }, { sendInstantly: true });
}

// User journey tracking
export function trackUserJourney(
    step: string,
    properties?: Record<string, any>
) {
    trackEvent('user_journey_step', {
        step,
        ...properties,
    });
}

// Group analytics
export function setGroup(
    groupType: string,
    groupId: string,
    properties?: Record<string, any>
) {
    if (!isEnabled) return;
    trackEvent('set_group', { groupType, groupId, ...properties });
}

// Super properties for all events
export function setSuperProperties(
    properties: Record<string, any>
) {
    if (!isEnabled) return;
    localStorage.setItem('analytics_super_props', JSON.stringify(properties));
}

// One-time super properties
export function setOnceProperties(
    properties: Record<string, any>
) {
    if (!isEnabled) return;
    const stored = localStorage.getItem('analytics_once_props');
    const existing = stored ? JSON.parse(stored) : {};
    localStorage.setItem('analytics_once_props', JSON.stringify({
        ...existing,
        ...properties,
    }));
}

// Disable tracking (for GDPR compliance)
export function disableTracking() {
    isEnabled = false;
    localStorage.setItem('analytics_enabled', 'false');
    analyticsQueue.length = 0; // Clear queue
}

// Enable tracking
export function enableTracking() {
    isEnabled = true;
    localStorage.setItem('analytics_enabled', 'true');
    processQueue(); // Process any queued events
}

// Check if tracking is enabled
export function isTrackingEnabled(): boolean {
    return isEnabled;
}

// Clear user data (for GDPR compliance)
export function clearUserData() {
    localStorage.removeItem('analytics_super_props');
    localStorage.removeItem('analytics_once_props');
    analyticsQueue.length = 0;
}

// Internal helper to process the queue
async function processQueue() {
    if (!isEnabled || analyticsQueue.length === 0) return;

    const events = [...analyticsQueue];
    analyticsQueue.length = 0;

    try {
        await sendToAnalyticsServer(events);
    } catch (error) {
        console.error('Failed to process analytics queue:', error);
        // Re-queue failed events
        analyticsQueue.push(...events);
    }
}

// Internal helper to send events to the analytics server
async function sendToAnalyticsServer(events: any) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Analytics event:', events);
        return;
    }

    // TODO: Implement actual analytics server endpoint
    // const response = await fetch('/api/analytics', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(events),
    // });
    
    // if (!response.ok) {
    //     throw new Error('Failed to send analytics');
    // }
}
