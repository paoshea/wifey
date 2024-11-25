'use client';

import { useTranslations } from 'next-intl';
import type { SignalMeasurement } from '../types/monitoring';

export class SignalMonitor {
  private isMonitoring: boolean = false;
  private monitoringInterval: number | null = null;
  private callback: ((measurement: SignalMeasurement) => void) | null = null;
  private t = useTranslations('coverage.errors');

  constructor() {
    if (!this.checkBrowserSupport()) {
      console.warn(this.t('unsupportedBrowser'));
      throw new Error(this.t('unsupportedBrowser'));
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
        throw new Error(this.t('locationDenied'));
      }
      
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(this.t('permissionError'));
    }
  }

  private async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error(this.t('unsupportedBrowser')));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error(this.t('locationDenied')));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error(this.t('locationUnavailable')));
              break;
            case error.TIMEOUT:
              reject(new Error(this.t('locationTimeout')));
              break;
            default:
              reject(new Error(this.t('locationError')));
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

    this.monitoringInterval = window.setInterval(async () => {
      if (this.isMonitoring && this.callback) {
        try {
          const measurement = await this.getMeasurement();
          this.callback(measurement);
        } catch (error) {
          this.stopMonitoring();
          throw error;
        }
      }
    }, interval);
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.callback = null;
  }
}

export const signalMonitor = new SignalMonitor();
