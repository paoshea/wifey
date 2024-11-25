'use client';

import type { SignalMeasurement } from '../types/monitoring';

export enum SignalMonitorError {
  UNSUPPORTED_BROWSER = 'UNSUPPORTED_BROWSER',
  LOCATION_DENIED = 'LOCATION_DENIED',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  LOCATION_TIMEOUT = 'LOCATION_TIMEOUT',
  LOCATION_ERROR = 'LOCATION_ERROR'
}

export class SignalMonitor {
  private isMonitoring: boolean = false;
  private monitoringInterval: number | null = null;
  private callback: ((measurement: SignalMeasurement) => void) | null = null;

  constructor() {
    if (!this.checkBrowserSupport()) {
      console.warn('Browser does not support required features');
      throw new Error(SignalMonitorError.UNSUPPORTED_BROWSER);
    }
  }

  private checkBrowserSupport(): boolean {
    return (
      typeof window !== 'undefined' &&
      'geolocation' in navigator &&
      'permissions' in navigator
    );
  }

  private async checkPermissions(): Promise<boolean> {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permissionStatus.state === 'denied') {
        throw new Error(SignalMonitorError.LOCATION_DENIED);
      }
      
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(SignalMonitorError.PERMISSION_ERROR);
    }
  }

  private async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error(SignalMonitorError.UNSUPPORTED_BROWSER));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error(SignalMonitorError.LOCATION_DENIED));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error(SignalMonitorError.LOCATION_UNAVAILABLE));
              break;
            case error.TIMEOUT:
              reject(new Error(SignalMonitorError.LOCATION_TIMEOUT));
              break;
            default:
              reject(new Error(SignalMonitorError.LOCATION_ERROR));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  private async getMeasurement(): Promise<SignalMeasurement> {
    const position = await this.getCurrentPosition();
    
    // Mock signal strength measurement since we can't get real values
    const mockSignalStrength = Math.floor(Math.random() * (-50 - (-120) + 1)) + (-120);
    
    return {
      timestamp: Date.now(),
      carrier: 'Unknown',
      network: 'Unknown',
      networkType: 'cellular',
      geolocation: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      signalStrength: mockSignalStrength,
      technology: '4G',
      provider: 'Unknown',
    };
  }

  public async startMonitoring(
    callback: (measurement: SignalMeasurement) => void,
    interval: number = 5000
  ): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    await this.checkPermissions();
    this.callback = callback;
    this.isMonitoring = true;

    // Get initial measurement
    try {
      const measurement = await this.getMeasurement();
      this.callback(measurement);
    } catch (error) {
      this.stopMonitoring();
      throw error;
    }

    // Start interval
    this.monitoringInterval = window.setInterval(async () => {
      try {
        const measurement = await this.getMeasurement();
        if (this.callback) {
          this.callback(measurement);
        }
      } catch (error) {
        this.stopMonitoring();
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(SignalMonitorError.LOCATION_ERROR);
      }
    }, interval);
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      window.clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    this.callback = null;
  }

  public clearMeasurements(): void {
    // No-op since we don't store measurements
  }
}

export const signalMonitor = new SignalMonitor();
