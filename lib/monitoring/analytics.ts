import posthog from 'posthog-js';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Initialize PostHog
export function initializeAnalytics() {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
            capture_pageview: false, // We'll handle this manually
            persistence: 'localStorage',
            autocapture: true,
            session_recording: {
                maskAllInputs: true,
                maskAllText: true,
            },
            property_blacklist: ['$current_url', '$pathname'], // Custom property handling
        });
    }
}

// Hook for tracking page views
export function usePageTracking() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname) {
            let url = window.origin + pathname;
            if (searchParams?.toString()) {
                url += `?${searchParams.toString()}`;
            }

            // Track pageview
            posthog.capture('$pageview', {
                $current_url: url,
                $pathname: pathname,
            });
        }
    }, [pathname, searchParams]);
}

// User identification
export function identifyUser(
    userId: string,
    properties?: Record<string, any>
) {
    posthog.identify(userId, properties);
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
    posthog.capture(eventName, {
        ...properties,
        timestamp: options?.timestamp?.toISOString(),
    }, { send_instantly: options?.sendInstantly });
}

// Performance tracking
export function trackPerformance(
    metricName: string,
    duration: number,
    properties?: Record<string, any>
) {
    trackEvent('performance_metric', {
        metric_name: metricName,
        duration_ms: duration,
        ...properties,
    });
}

// User behavior tracking
export const userBehaviorEvents = {
    // Coverage related events
    MARK_COVERAGE: 'mark_coverage_spot',
    VIEW_COVERAGE: 'view_coverage_map',
    SEARCH_COVERAGE: 'search_coverage',
    CALCULATE_DISTANCE: 'calculate_distance',
    
    // User interaction events
    BUTTON_CLICK: 'button_click',
    FORM_SUBMIT: 'form_submit',
    MAP_INTERACTION: 'map_interaction',
    FEATURE_USE: 'feature_use',
    
    // Achievement events
    EARN_BADGE: 'earn_badge',
    LEVEL_UP: 'level_up',
    COMPLETE_STREAK: 'complete_streak',
    
    // Error events
    ENCOUNTER_ERROR: 'encounter_error',
    RECOVERY_ATTEMPT: 'recovery_attempt',
} as const;

// Feature usage tracking
export function trackFeatureUsage(
    featureName: string,
    properties?: Record<string, any>
) {
    trackEvent(userBehaviorEvents.FEATURE_USE, {
        feature_name: featureName,
        ...properties,
    });
}

// Error tracking
export function trackError(
    error: Error,
    context?: Record<string, any>
) {
    trackEvent(userBehaviorEvents.ENCOUNTER_ERROR, {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        ...context,
    });
}

// User session tracking
export function startUserSession(
    userId: string,
    sessionProperties?: Record<string, any>
) {
    posthog.reset(); // Clear previous session data
    identifyUser(userId);
    
    trackEvent('session_start', {
        session_id: Date.now().toString(),
        ...sessionProperties,
    });
}

// User journey tracking
export function trackUserJourney(
    step: string,
    properties?: Record<string, any>
) {
    trackEvent('user_journey_step', {
        journey_step: step,
        ...properties,
    });
}

// Group analytics
export function setGroup(
    groupType: string,
    groupId: string,
    properties?: Record<string, any>
) {
    posthog.group(groupType, groupId, properties);
}

// Super properties for all events
export function setSuperProperties(
    properties: Record<string, any>
) {
    posthog.register(properties);
}

// One-time super properties
export function setOnceProperties(
    properties: Record<string, any>
) {
    posthog.register_once(properties);
}

// Disable tracking (for GDPR compliance)
export function disableTracking() {
    posthog.opt_out();
}

// Enable tracking
export function enableTracking() {
    posthog.opt_in();
}

// Check if tracking is enabled
export function isTrackingEnabled(): boolean {
    return !posthog.has_opted_out();
}

// Clear user data (for GDPR compliance)
export function clearUserData() {
    posthog.reset();
}
