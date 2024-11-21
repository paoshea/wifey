import { trackPerformance as trackSentryPerformance } from './sentry';
import { trackPerformance as trackAnalyticsPerformance } from './analytics';

// Web Vitals metrics
type WebVitalsMetric = {
    id: string;
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
};

// Performance timing metrics
interface PerformanceMetrics {
    timeToFirstByte: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    timeToInteractive: number;
    totalBlockingTime: number;
}

class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: Map<string, number> = new Map();
    private marks: Map<string, number> = new Map();

    private constructor() {
        this.initializeObservers();
    }

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    private initializeObservers() {
        // Initialize Performance Observer for LCP
        if (typeof window !== 'undefined') {
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.set('LCP', lastEntry.startTime);
                this.trackMetric('LargestContentfulPaint', lastEntry.startTime);
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // Initialize Performance Observer for FID
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (entry instanceof PerformanceEventTiming) {
                        this.metrics.set('FID', entry.processingStart - entry.startTime);
                        this.trackMetric('FirstInputDelay', entry.processingStart - entry.startTime);
                    }
                });
            }).observe({ entryTypes: ['first-input'] });

            // Initialize Performance Observer for CLS
            new PerformanceObserver((entryList) => {
                let clsValue = 0;
                entryList.getEntries().forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += (entry as any).value;
                    }
                });
                this.metrics.set('CLS', clsValue);
                this.trackMetric('CumulativeLayoutShift', clsValue);
            }).observe({ entryTypes: ['layout-shift'] });

            // Track navigation timing metrics
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                    if (navigationTiming) {
                        this.trackNavigationTiming(navigationTiming);
                    }
                }, 0);
            });
        }
    }

    private trackNavigationTiming(timing: PerformanceNavigationTiming) {
        const metrics = {
            timeToFirstByte: timing.responseStart - timing.requestStart,
            domInteractive: timing.domInteractive - timing.fetchStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.fetchStart,
            domComplete: timing.domComplete - timing.fetchStart,
            loadComplete: timing.loadEventEnd - timing.fetchStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        };

        Object.entries(metrics).forEach(([name, value]) => {
            this.trackMetric(name, value);
        });
    }

    // Start timing a custom operation
    startMark(name: string) {
        this.marks.set(name, performance.now());
    }

    // End timing and track the duration
    endMark(name: string, properties?: Record<string, any>) {
        const startTime = this.marks.get(name);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.trackMetric(name, duration, properties);
            this.marks.delete(name);
        }
    }

    // Track a performance metric
    private trackMetric(name: string, value: number, properties?: Record<string, any>) {
        // Track in both monitoring systems
        trackSentryPerformance(name, { value, ...properties });
        trackAnalyticsPerformance(name, value, properties);

        // Store metric
        this.metrics.set(name, value);
    }

    // Get all collected metrics
    getMetrics(): Record<string, number> {
        return Object.fromEntries(this.metrics);
    }

    // Track a web vital metric
    trackWebVital(metric: WebVitalsMetric) {
        this.trackMetric(metric.name, metric.value, {
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id
        });
    }

    // Track resource timing
    trackResourceTiming(resourceName: string) {
        const entries = performance.getEntriesByType('resource')
            .filter(entry => entry.name.includes(resourceName));

        entries.forEach(entry => {
            this.trackMetric(`resource_${resourceName}`, entry.duration, {
                transferSize: entry.transferSize,
                encodedBodySize: entry.encodedBodySize,
                decodedBodySize: entry.decodedBodySize
            });
        });
    }

    // Clear all metrics
    clearMetrics() {
        this.metrics.clear();
        this.marks.clear();
        if (typeof window !== 'undefined') {
            performance.clearMarks();
            performance.clearMeasures();
            performance.clearResourceTimings();
        }
    }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
