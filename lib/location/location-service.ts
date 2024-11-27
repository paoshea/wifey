import { useEffect, useRef, useState } from 'react';
import { LocationData, LocationError, LocationServiceConfig } from './types';

export class LocationService {
  private watchId: number | null = null;
  private listeners: Set<(location: LocationData) => void> = new Set();
  private errorListeners: Set<(error: LocationError) => void> = new Set();
  private config: LocationServiceConfig;
  private isActive: boolean = false;
  private cleanupHandlers: Set<() => void> = new Set();

  constructor(config: LocationServiceConfig = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 5000
  }) {
    this.config = config;
  }

  public start(): void {
    if (this.isActive) return;
    
    if (!navigator.geolocation) {
      this.notifyError({
        code: 'GEOLOCATION_NOT_SUPPORTED',
        message: 'Geolocation is not supported by this browser.'
      });
      return;
    }

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          };
          this.notifyListeners(locationData);
        },
        (error) => {
          this.notifyError({
            code: 'POSITION_ERROR',
            message: error.message,
            originalError: error
          });
        },
        this.config
      );
      
      this.isActive = true;
    } catch (error) {
      this.notifyError({
        code: 'WATCH_POSITION_ERROR',
        message: 'Error starting location watch',
        originalError: error
      });
    }
  }

  public stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isActive = false;
  }

  public addLocationListener(listener: (location: LocationData) => void): () => void {
    this.listeners.add(listener);
    const cleanup = () => this.listeners.delete(listener);
    this.cleanupHandlers.add(cleanup);
    return cleanup;
  }

  public addErrorListener(listener: (error: LocationError) => void): () => void {
    this.errorListeners.add(listener);
    const cleanup = () => this.errorListeners.delete(listener);
    this.cleanupHandlers.add(cleanup);
    return cleanup;
  }

  public cleanup(): void {
    this.stop();
    this.cleanupHandlers.forEach(cleanup => cleanup());
    this.cleanupHandlers.clear();
    this.listeners.clear();
    this.errorListeners.clear();
  }

  private notifyListeners(location: LocationData): void {
    this.listeners.forEach(listener => {
      try {
        listener(location);
      } catch (error) {
        console.error('Error in location listener:', error);
      }
    });
  }

  private notifyError(error: LocationError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }
}

// React hook for using LocationService
export function useLocationService(config?: LocationServiceConfig) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const serviceRef = useRef<LocationService | null>(null);

  useEffect(() => {
    // Initialize service if it doesn't exist
    if (!serviceRef.current) {
      serviceRef.current = new LocationService(config);
    }

    const service = serviceRef.current;
    
    // Add listeners
    const locationCleanup = service.addLocationListener(setLocation);
    const errorCleanup = service.addErrorListener(setError);
    
    // Start the service
    service.start();

    // Cleanup function
    return () => {
      locationCleanup();
      errorCleanup();
      service.cleanup();
      serviceRef.current = null;
    };
  }, [config]); // Only recreate if config changes

  return { location, error };
}

// Types file
export type { LocationData, LocationError, LocationServiceConfig } from './types';
