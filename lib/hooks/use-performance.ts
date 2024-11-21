import { useEffect, useCallback, useRef } from 'react';
import { performanceMonitor } from '@/lib/services/performance-monitor';
import { useMonitoring } from '@/components/providers/monitoring-provider';

interface UsePerformanceOptions {
  componentName: string;
  trackRenders?: boolean;
  trackEffects?: boolean;
  trackEvents?: boolean;
  thresholds?: {
    renderTime?: number;
    effectTime?: number;
    eventTime?: number;
  };
}

export function usePerformance({
  componentName,
  trackRenders = true,
  trackEffects = true,
  trackEvents = true,
  thresholds = {
    renderTime: 16, // 60fps frame budget
    effectTime: 100,
    eventTime: 50,
  },
}: UsePerformanceOptions) {
  const { trackEvent } = useMonitoring();
  const renderCount = useRef(0);
  const mountTime = useRef(0);

  // Track mount and unmount
  useEffect(() => {
    mountTime.current = performance.now();
    performanceMonitor.startMark(`${componentName}_mount`);

    return () => {
      const unmountTime = performance.now();
      const duration = unmountTime - mountTime.current;
      performanceMonitor.endMark(`${componentName}_mount`, {
        renderCount: renderCount.current,
        duration,
      });

      trackEvent('component_lifecycle', {
        component: componentName,
        type: 'unmount',
        duration,
        renderCount: renderCount.current,
      });
    };
  }, [componentName, trackEvent]);

  // Track renders
  useEffect(() => {
    if (trackRenders) {
      renderCount.current++;
      const renderTime = performance.now() - mountTime.current;

      if (renderTime > (thresholds.renderTime || 16)) {
        trackEvent('slow_render', {
          component: componentName,
          renderTime,
          renderCount: renderCount.current,
        });
      }

      performanceMonitor.recordMetric(`${componentName}_render`, renderTime, {
        renderCount: renderCount.current,
      });
    }
  });

  // Track effect performance
  const trackEffect = useCallback((
    effectName: string,
    effect: () => void | (() => void)
  ) => {
    if (!trackEffects) return effect;

    return () => {
      performanceMonitor.startMark(`${componentName}_effect_${effectName}`);
      const cleanup = effect();
      const duration = performanceMonitor.endMark(`${componentName}_effect_${effectName}`);

      if (duration > (thresholds.effectTime || 100)) {
        trackEvent('slow_effect', {
          component: componentName,
          effect: effectName,
          duration,
        });
      }

      return cleanup;
    };
  }, [componentName, trackEffects, thresholds.effectTime, trackEvent]);

  // Track event handler performance
  const trackEventHandler = useCallback(<T extends (...args: any[]) => any>(
    eventName: string,
    handler: T
  ): T => {
    if (!trackEvents) return handler;

    return ((...args: Parameters<T>) => {
      performanceMonitor.startMark(`${componentName}_event_${eventName}`);
      const result = handler(...args);
      const duration = performanceMonitor.endMark(`${componentName}_event_${eventName}`);

      if (duration > (thresholds.eventTime || 50)) {
        trackEvent('slow_event_handler', {
          component: componentName,
          event: eventName,
          duration,
        });
      }

      return result;
    }) as T;
  }, [componentName, trackEvents, thresholds.eventTime, trackEvent]);

  // Create performance report
  const getPerformanceReport = useCallback(() => {
    const metrics = performanceMonitor.getMetrics();
    const componentMetrics = metrics.filter(
      metric => metric.name.startsWith(componentName)
    );

    return {
      renderCount: renderCount.current,
      mountDuration: componentMetrics.find(
        m => m.name === `${componentName}_mount`
      )?.value || 0,
      averageRenderTime: performanceMonitor.getAverageMetric(
        `${componentName}_render`
      ),
      slowRenders: componentMetrics.filter(
        m => m.name === `${componentName}_render` && m.value > (thresholds.renderTime || 16)
      ).length,
      slowEffects: componentMetrics.filter(
        m => m.name.startsWith(`${componentName}_effect_`) && 
            m.value > (thresholds.effectTime || 100)
      ).length,
      slowEvents: componentMetrics.filter(
        m => m.name.startsWith(`${componentName}_event_`) && 
            m.value > (thresholds.eventTime || 50)
      ).length,
    };
  }, [componentName, thresholds]);

  return {
    trackEffect,
    trackEventHandler,
    getPerformanceReport,
    renderCount: renderCount.current,
  };
}

// Example usage:
/*
function MyComponent() {
  const { trackEffect, trackEventHandler } = usePerformance({
    componentName: 'MyComponent',
    thresholds: {
      renderTime: 20,
      effectTime: 150,
      eventTime: 75,
    },
  });

  useEffect(
    trackEffect('data-fetch', () => {
      // Effect logic
    }),
    []
  );

  const handleClick = trackEventHandler('button-click', () => {
    // Event handler logic
  });

  return <button onClick={handleClick}>Click Me</button>;
}
*/
