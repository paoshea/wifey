export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  speed?: number | null;
  heading?: number | null;
  altitude?: number | null;
}

export interface LocationError {
  code: number;
  message: string;
}

type LocationCallback = (location: LocationData) => void;
type ErrorCallback = (error: LocationError) => void;

export class LocationTracker {
  private watchId: number | null = null;
  private lastLocation: LocationData | null = null;

  constructor(
    private readonly options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  ) {}

  getCurrentPosition(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!this.isGeolocationSupported()) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = this.formatPosition(position);
          this.lastLocation = locationData;
          resolve(locationData);
        },
        (error) => {
          reject(this.formatError(error));
        },
        this.options
      );
    });
  }

  startTracking(onLocation: LocationCallback, onError?: ErrorCallback): void {
    if (!this.isGeolocationSupported()) {
      if (onError) {
        onError({
          code: -1,
          message: 'Geolocation is not supported by your browser'
        });
      }
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = this.formatPosition(position);
        this.lastLocation = locationData;
        onLocation(locationData);
      },
      (error) => {
        if (onError) {
          onError(this.formatError(error));
        }
      },
      this.options
    );
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getLastLocation(): LocationData | null {
    return this.lastLocation;
  }

  isTracking(): boolean {
    return this.watchId !== null;
  }

  calculateDistance(from: LocationData, to: LocationData): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (from.latitude * Math.PI) / 180;
    const φ2 = (to.latitude * Math.PI) / 180;
    const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  formatPosition(position: GeolocationPosition): LocationData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp
    };
  }

  formatError(error: GeolocationPositionError): LocationError {
    let message = 'Unknown error occurred';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location permission denied';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out';
        break;
    }
    return { code: error.code, message };
  }

  generateGoogleMapsUrl(location: LocationData): string {
    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }

  private isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }
}
