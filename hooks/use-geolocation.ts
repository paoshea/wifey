import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface GeolocationHook {
  location: GeolocationState | null;
  error: GeolocationError | null;
  isWatching: boolean;
  startWatching: () => void;
  stopWatching: () => void;
}

interface GeolocationError {
  code: number;
  message: string;
}

export function useGeolocation(): GeolocationHook {
  const [location, setLocation] = useState<GeolocationState | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const handleSuccess = (position: GeolocationPosition) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    });
    setError(null);
  };

  const handleError = (error: GeolocationPositionError) => {
    setError({
      code: error.code,
      message: error.message,
    });
  };

  const startWatching = () => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });

    // Start watching position
    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });

    setWatchId(id);
  };

  const stopWatching = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, []);

  return {
    location,
    error,
    isWatching: watchId !== null,
    startWatching,
    stopWatching,
  };
}
