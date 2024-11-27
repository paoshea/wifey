import { useState, useEffect, useCallback } from 'react';
import { signalMonitor } from '@/lib/monitoring/signal-monitor';
import { SignalMeasurement, SignalMonitorError } from '@/lib/types/monitoring';

interface UseSignalMonitorOptions {
  onMeasurement?: (measurement: SignalMeasurement) => void;
  interval?: number;
  autoStart?: boolean;
  onError?: (error: SignalMonitorError) => void;
}

export function useSignalMonitor({
  onMeasurement,
  interval,
  autoStart = false,
  onError
}: UseSignalMonitorOptions = {}) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [measurements, setMeasurements] = useState<SignalMeasurement[]>([]);
  const [error, setError] = useState<SignalMonitorError | null>(null);

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
      const monitorError = err instanceof Error ? 
        (Object.values(SignalMonitorError).includes(err.message as SignalMonitorError) ? 
          err.message as SignalMonitorError : 
          SignalMonitorError.LOCATION_ERROR) :
        SignalMonitorError.LOCATION_ERROR;
      
      setError(monitorError);
      onError?.(monitorError);
      setIsMonitoring(false);
    }
  }, [handleMeasurement, interval, onError]);

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
