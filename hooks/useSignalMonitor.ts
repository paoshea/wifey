import { useState, useEffect, useCallback } from 'react';
import { signalMonitor, SignalMeasurement } from '@/lib/monitoring/signal-monitor';

interface UseSignalMonitorOptions {
  onMeasurement?: (measurement: SignalMeasurement) => void;
  interval?: number;
  autoStart?: boolean;
}

export function useSignalMonitor({
  onMeasurement,
  interval,
  autoStart = false
}: UseSignalMonitorOptions = {}) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [measurements, setMeasurements] = useState<SignalMeasurement[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const handleMeasurement = useCallback((measurement: SignalMeasurement) => {
    setMeasurements(prev => [...prev, measurement]);
    onMeasurement?.(measurement);
  }, [onMeasurement]);

  const startMonitoring = useCallback(async () => {
    try {
      setError(null);
      await signalMonitor.startMonitoring(handleMeasurement, interval);
      setIsMonitoring(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start monitoring'));
      setIsMonitoring(false);
    }
  }, [handleMeasurement, interval]);

  const stopMonitoring = useCallback(() => {
    signalMonitor.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  const clearMeasurements = useCallback(() => {
    signalMonitor.clearMeasurements();
    setMeasurements([]);
  }, []);

  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [autoStart, startMonitoring, stopMonitoring]);

  return {
    isMonitoring,
    measurements,
    error,
    startMonitoring,
    stopMonitoring,
    clearMeasurements
  };
}
