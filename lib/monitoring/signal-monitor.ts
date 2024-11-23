import { CarrierCoverage } from '../carriers/types';

interface SignalMeasurement {
  timestamp: number;
  signalStrength: number;
  technology: '2G' | '3G' | '4G' | '5G';
  location: {
    lat: number;
    lng: number;
  };
  provider: string;
  connectionType?: string;
  isRoaming?: boolean;
}

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
      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  private async getConnectionInfo(): Promise<Partial<SignalMeasurement>> {
    const connection = (navigator as any).connection;
    
    if (!connection) {
      return {};
    }

    return {
      connectionType: connection.type,
      technology: this.detectNetworkTechnology(connection),
      provider: await this.detectCarrier()
    };
  }

  private detectNetworkTechnology(connection: any): '2G' | '3G' | '4G' | '5G' {
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
        // Use connection.type to detect 5G
        return connection.type === '5g' ? '5G' : '4G';
    }
  }

  private async detectCarrier(): Promise<string> {
    // This is a placeholder - actual carrier detection would depend on
    // platform-specific APIs or user input
    return 'unknown';
  }

  private async measureSignalStrength(): Promise<number> {
    const connection = (navigator as any).connection;
    
    if (!connection || typeof connection.signalStrength === 'undefined') {
      // If we can't get actual signal strength, estimate based on connection quality
      switch (connection?.effectiveType) {
        case 'slow-2g':
          return 1;
        case '2g':
          return 2;
        case '3g':
          return 3;
        case '4g':
        case '5g':
          return 4;
        default:
          return 0;
      }
    }

    return connection.signalStrength;
  }

  private async takeMeasurement(): Promise<SignalMeasurement> {
    try {
      const position = await this.getCurrentLocation();
      const connectionInfo = await this.getConnectionInfo();
      const signalStrength = await this.measureSignalStrength();

      const measurement: SignalMeasurement = {
        timestamp: Date.now(),
        signalStrength,
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        ...connectionInfo,
        technology: connectionInfo.technology || '4G',
        provider: connectionInfo.provider || 'unknown'
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
