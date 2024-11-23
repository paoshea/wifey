import { CarrierCoverage } from '../carriers/types';
import type { SignalMeasurement } from '../types/monitoring';

class SignalMonitor {
  private isMonitoring: boolean = false;
  private monitoringInterval: number | null = null;
  private measurements: SignalMeasurement[] = [];
  private readonly DEFAULT_INTERVAL = 30000; // 30 seconds
  private onMeasurementCallback?: (measurement: SignalMeasurement) => void;

  constructor() {
    if (!this.checkBrowserSupport()) {
      console.warn('Browser does not support required APIs for signal monitoring');
    }
  }

  private checkBrowserSupport(): boolean {
    return !!(
      'connection' in navigator &&
      'geolocation' in navigator &&
      'permissions' in navigator
    );
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      const locationPermission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (locationPermission.state === 'denied') {
        throw new Error('Location permission is required for signal monitoring');
      }

      // Request location permission if not granted
      if (locationPermission.state === 'prompt') {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  private async getCurrentLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  }

  private async getConnectionInfo(): Promise<Partial<SignalMeasurement>> {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) {
      return {
        technology: '4G',
        provider: 'unknown',
      };
    }

    return {
      connectionType: connection.type,
      technology: this.detectNetworkTechnology(connection),
      provider: await this.detectCarrier(),
      isRoaming: connection.isRoaming,
    };
  }

  private detectNetworkTechnology(connection: any): '2G' | '3G' | '4G' | '5G' {
    if (!connection || !connection.effectiveType) {
      return '4G';
    }

    const effectiveType = connection.effectiveType;
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return '2G';
      case '3g':
        return '3G';
      case '4g':
        return '4G';
      default:
        return connection.type === '5g' ? '5G' : '4G';
    }
  }

  private async detectCarrier(): Promise<string> {
    try {
      const mobileInfo = (navigator as any).mozMobileConnection || 
                        (navigator as any).mobileConnection;
      if (mobileInfo && mobileInfo.carrier) {
        return mobileInfo.carrier;
      }

      const connection = (navigator as any).connection;
      if (connection && connection.carrier) {
        return connection.carrier;
      }

      return 'unknown';
    } catch (error) {
      console.warn('Error detecting carrier:', error);
      return 'unknown';
    }
  }

  private async measureSignalStrength(): Promise<number> {
    try {
      const mobileInfo = (navigator as any).mozMobileConnection || 
                        (navigator as any).mobileConnection;
      if (mobileInfo && typeof mobileInfo.signalStrength === 'number') {
        return mobileInfo.signalStrength;
      }

      const connection = (navigator as any).connection;
      if (connection && typeof connection.signalStrength === 'number') {
        return connection.signalStrength;
      }

      return -1;
    } catch (error) {
      console.warn('Error measuring signal strength:', error);
      return -1;
    }
  }

  async takeMeasurement(): Promise<SignalMeasurement> {
    try {
      const [position, connectionInfo, signalStrength] = await Promise.all([
        this.getCurrentLocation(),
        this.getConnectionInfo(),
        this.measureSignalStrength(),
      ]);

      const measurement: SignalMeasurement = {
        timestamp: Date.now(),
        signalStrength,
        technology: this.detectNetworkTechnology(connectionInfo) || '4G',
        geolocation: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        provider: connectionInfo.provider || await this.detectCarrier() || 'unknown',
        carrier: connectionInfo.provider || await this.detectCarrier() || 'unknown',
        network: connectionInfo.connectionType || 'unknown',
        networkType: connectionInfo.connectionType || 'unknown',
        ...(connectionInfo.connectionType && { connectionType: connectionInfo.connectionType }),
        ...(typeof connectionInfo.isRoaming === 'boolean' && { isRoaming: connectionInfo.isRoaming }),
      };

      this.measurements.push(measurement);
      this.onMeasurementCallback?.(measurement);

      return measurement;
    } catch (error) {
      console.error('Error taking measurement:', error);
      throw error;
    }
  }

  public async startMonitoring(
    callback?: (measurement: SignalMeasurement) => void,
    interval: number = this.DEFAULT_INTERVAL
  ): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Required permissions not granted');
    }

    this.onMeasurementCallback = callback;
    this.isMonitoring = true;

    // Take initial measurement
    await this.takeMeasurement();

    // Start periodic measurements
    this.monitoringInterval = window.setInterval(async () => {
      if (this.isMonitoring) {
        await this.takeMeasurement();
      }
    }, interval);
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  public getMeasurements(): SignalMeasurement[] {
    return [...this.measurements];
  }

  public clearMeasurements(): void {
    this.measurements = [];
  }
}

export const signalMonitor = new SignalMonitor();
export type { SignalMeasurement };
