// lib/monitoring/signal-monitor.ts

'use client';

import { type SignalMeasurement, SignalMonitorError, SignalMonitorErrorType } from '../types/monitoring';

export class SignalMonitor {
  clearMeasurements() {
    throw new Error('Method not implemented.');
  }
  private intervalId: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  constructor() {
    this.checkBrowserSupport();
  }

  private checkBrowserSupport(): void {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      throw SignalMonitorError.UNSUPPORTED_BROWSER;
    }
  }

  private async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(SignalMonitorError.LOCATION_DENIED);
              break;
            case error.POSITION_UNAVAILABLE:
              reject(SignalMonitorError.LOCATION_UNAVAILABLE);
              break;
            case error.TIMEOUT:
              reject(SignalMonitorError.LOCATION_TIMEOUT);
              break;
            default:
              reject(SignalMonitorError.LOCATION_ERROR);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  private async getNetworkInfo(): Promise<Partial<SignalMeasurement>> {
    // @ts-ignore - Connection API types
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    return {
      network: connection?.type || 'unknown',
      technology: connection?.effectiveType || 'unknown',
      carrier: 'unknown', // Will be detected server-side
      provider: connection?.type === 'cellular' ? connection?.carrier : 'unknown',
      device: {
        type: this.getDeviceType(),
        model: navigator.userAgent,
        os: this.getOperatingSystem()
      }
    };
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getOperatingSystem(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'unknown';
  }

  private async getMeasurement(): Promise<SignalMeasurement> {
    try {
      const position = await this.getCurrentPosition();
      const networkInfo = await this.getNetworkInfo();

      return {
        timestamp: Date.now(),
        geolocation: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        },
        ...networkInfo
      } as SignalMeasurement;
    } catch (error) {
      if (error instanceof SignalMonitorError) {
        throw error;
      }
      throw SignalMonitorError.UNKNOWN_ERROR;
    }
  }

  async startMonitoring(
    callback: (measurement: SignalMeasurement) => void,
    interval: number = 5000
  ): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    try {
      // Get initial measurement
      const measurement = await this.getMeasurement();
      callback(measurement);

      // Start periodic measurements
      this.intervalId = setInterval(async () => {
        try {
          const measurement = await this.getMeasurement();
          callback(measurement);
        } catch (error) {
          this.stopMonitoring();
          throw error;
        }
      }, interval);

      this.isMonitoring = true;
    } catch (error) {
      this.stopMonitoring();
      throw error;
    }
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
  }
}

export const signalMonitor = new SignalMonitor();
