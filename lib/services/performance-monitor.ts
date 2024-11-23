import { logError } from '@/lib/monitoring/sentry';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  critical: number;
  warning: number;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources: ReadonlyArray<LayoutShiftAttribution>;
}

interface LayoutShiftAttribution {
  node?: Node;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}

const DEFAULT_THRESHOLDS: Record<string, PerformanceThresholds> = {
  'time-to-interactive': { critical: 3500, warning: 2000 },
  'first-contentful-paint': { critical: 2000, warning: 1000 },
  'largest-contentful-paint': { critical: 2500, warning: 1500 },
  'first-input-delay': { critical: 300, warning: 100 },
  'cumulative-layout-shift': { critical: 0.25, warning: 0.1 },
  'api-response-time': { critical: 1000, warning: 500 },
  'map-render-time': { critical: 1500, warning: 800 },
  'offline-sync-time': { critical: 5000, warning: 2000 },
};

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();
  private thresholds: Record<string, PerformanceThresholds>;
  private readonly MAX_METRICS = 1000;

  private constructor() {
    this.thresholds = { ...DEFAULT_THRESHOLDS };
    this.initializeObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Observe Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('largest-contentful-paint', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Observe First Input Delay
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (entry instanceof PerformanceEventTiming) {
          this.recordMetric('first-input-delay', entry.processingStart - entry.startTime);
        }
      });
    }).observe({ entryTypes: ['first-input'] });

    // Observe Layout Shifts
    new PerformanceObserver((entryList) => {
      let clsValue = 0;
      entryList.getEntries().forEach((entry) => {
        const layoutShift = entry as LayoutShift;
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      });
      this.recordMetric('cumulative-layout-shift', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });

    // Observe Long Tasks
    new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach(entry => {
        this.recordMetric('long-task', entry.duration, {
          startTime: entry.startTime,
          name: entry.name,
        });
      });
    }).observe({ entryTypes: ['longtask'] });
  }

  startMark(name: string): void {
    this.marks.set(name, performance.now());
  }

  endMark(name: string, metadata?: Record<string, any>): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      logError(new Error(`No start mark found for: ${name}`));
      return 0;
    }

    const duration = performance.now() - startTime;
    this.recordMetric(name, duration, metadata);
    this.marks.delete(name);
    return duration;
  }

  private recordMetric(
    name: string,
    value: number,
    metadata?: Record<string, any>
  ): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata,
    });

    // Check threshold and log if exceeded
    const threshold = this.thresholds[name];
    if (threshold) {
      if (value >= threshold.critical) {
        logError(new Error(`Critical performance threshold exceeded for ${name}`), {
          metric: name,
          value,
          threshold: threshold.critical,
          metadata,
        });
      } else if (value >= threshold.warning) {
        console.warn(`Performance warning for ${name}:`, {
          value,
          threshold: threshold.warning,
          metadata,
        });
      }
    }

    // Maintain metrics array size
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  getMetrics(
    name?: string,
    timeRange?: { start: number; end: number }
  ): PerformanceMetric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(metric => metric.name === name);
    }

    if (timeRange) {
      filtered = filtered.filter(
        metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
      );
    }

    return filtered;
  }

  getAverageMetric(name: string, timeRange?: { start: number; end: number }): number {
    const metrics = this.getMetrics(name, timeRange);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  setThreshold(name: string, threshold: PerformanceThresholds): void {
    this.thresholds[name] = threshold;
  }

  clearMetrics(): void {
    this.metrics = [];
    this.marks.clear();
  }

  getPerformanceReport(): {
    metrics: Record<string, { avg: number; min: number; max: number }>;
    thresholdViolations: number;
    totalMetrics: number;
  } {
    const report: Record<string, { values: number[]; violations: number }> = {};

    this.metrics.forEach(metric => {
      if (!report[metric.name]) {
        report[metric.name] = { values: [], violations: 0 };
      }

      report[metric.name].values.push(metric.value);

      const threshold = this.thresholds[metric.name];
      if (threshold && metric.value >= threshold.warning) {
        report[metric.name].violations++;
      }
    });

    return {
      metrics: Object.entries(report).reduce((acc, [name, data]) => {
        acc[name] = {
          avg: data.values.reduce((sum, val) => sum + val, 0) / data.values.length,
          min: Math.min(...data.values),
          max: Math.max(...data.values),
        };
        return acc;
      }, {} as Record<string, { avg: number; min: number; max: number }>),
      thresholdViolations: Object.values(report).reduce(
        (sum, data) => sum + data.violations,
        0
      ),
      totalMetrics: this.metrics.length,
    };
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
