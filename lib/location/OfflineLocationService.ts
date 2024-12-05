'use client';

interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    heading?: number;
    speed?: number;
    altitude?: number;
    altitudeAccuracy?: number;
  };
  timestamp: number;
}

interface StoredLocationHistory {
  locations: LocationData[];
  lastSync?: number;
}

export class OfflineLocationService {
  private static instance: OfflineLocationService;
  private watchId: number | null = null;
  private locationHistory: LocationData[] = [];
  private readonly STORAGE_KEY = 'wifey_location_history';
  private readonly MAX_HISTORY_SIZE = 1000; // Limit stored locations
  private listeners: Set<(location: LocationData) => void> = new Set();
  private isInitialized = false;

  private constructor() {
    // Constructor is empty - initialization happens in init()
  }

  static getInstance(): OfflineLocationService {
    if (!OfflineLocationService.instance) {
      OfflineLocationService.instance = new OfflineLocationService();
    }
    return OfflineLocationService.instance;
  }

  async init(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.loadFromStorage();
    window.addEventListener('online', this.handleOnline.bind(this));
    this.isInitialized = true;
  }

  startTracking(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Cannot track location in server environment'));
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      // First get a single position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.handleNewPosition(position);
          this.startContinuousTracking();
          resolve();
        },
        (error) => {
          reject(this.handleError(error));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  }

  private startContinuousTracking(): void {
    if (typeof window === 'undefined') return;

    this.watchId = navigator.geolocation.watchPosition(
      this.handleNewPosition.bind(this),
      this.handleError.bind(this),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }

  stopTracking(): void {
    if (typeof window === 'undefined') return;

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  addListener(callback: (location: LocationData) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getLastLocation(): LocationData | null {
    return this.locationHistory[this.locationHistory.length - 1] || null;
  }

  getLocationHistory(): LocationData[] {
    return [...this.locationHistory];
  }

  getCurrentSpeed(): number | null {
    if (this.locationHistory.length < 2) return null;

    const last = this.locationHistory[this.locationHistory.length - 1];
    const previous = this.locationHistory[this.locationHistory.length - 2];

    const distance = this.calculateDistance(
      previous.coords.latitude,
      previous.coords.longitude,
      last.coords.latitude,
      last.coords.longitude
    );

    const timeSeconds = (last.timestamp - previous.timestamp) / 1000;
    return distance / timeSeconds; // meters per second
  }

  getAverageAccuracy(): number | null {
    if (this.locationHistory.length === 0) return null;

    const sum = this.locationHistory.reduce(
      (acc, loc) => acc + loc.coords.accuracy,
      0
    );
    return sum / this.locationHistory.length;
  }

  private handleNewPosition(position: GeolocationPosition): void {
    const locationData: LocationData = {
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined
      },
      timestamp: position.timestamp
    };

    this.locationHistory.push(locationData);

    // Limit history size
    if (this.locationHistory.length > this.MAX_HISTORY_SIZE) {
      this.locationHistory = this.locationHistory.slice(-this.MAX_HISTORY_SIZE);
    }

    this.saveToStorage();
    this.notifyListeners(locationData);
  }

  private handleError(error: GeolocationPositionError): Error {
    let message: string;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied. Please enable location services.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable. Please check your device settings.';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out. Please try again.';
        break;
      default:
        message = 'An unknown error occurred while getting location.';
    }
    return new Error(message);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δφ = this.toRadians(lat2 - lat1);
    const Δλ = this.toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data: StoredLocationHistory = {
        locations: this.locationHistory,
        lastSync: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save location history to storage:', e);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data: StoredLocationHistory = JSON.parse(stored);
        this.locationHistory = data.locations;
      }
    } catch (e) {
      console.warn('Failed to load location history from storage:', e);
    }
  }

  private handleOnline(): void {
    // Here you can implement sync logic with your backend
    // For example, send stored locations that haven't been synced
    console.log('Device is online, syncing location history...');
  }

  private notifyListeners(location: LocationData): void {
    this.listeners.forEach(callback => callback(location));
  }

  clearHistory(): void {
    this.locationHistory = [];
    this.saveToStorage();
  }
}
