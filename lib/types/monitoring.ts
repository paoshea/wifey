export interface SignalMeasurement {
  id?: string;  // Optional for new measurements
  timestamp: number;
  carrier: string;
  network: string;
  networkType: string;
  device: {
    type: string;
    model: string;
    os: string;
  };
  signalStrength: number;
  technology: '2G' | '3G' | '4G' | '5G';
  provider: string;
  geolocation: {
    lat: number;
    lng: number;
  };
  connectionType?: string;  // Optional field for connection type
  isRoaming?: boolean;     // Optional field for roaming status
}

export interface CarrierCoverage {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  altitudeAccuracy: number;
  heading: number;
  speed: number;
  timestamp: number;
  geolocation: {
    lat: number;
    lng: number;
  };
  location: {
    lat: number;
    lng: number;
  };
  carrier: string;
  signalStrength: number;
  network: string;
  reliability: number;
  type: string;
  metadata: Record<string, unknown>;
  timezone: string;
  networkType: string;
  deviceId: string;
  device: {
    type: string;
    model: string;
    os: string;
  };
  technology: '2G' | '3G' | '4G' | '5G';
  provider: string;
  connectionType?: string;
  isRoaming?: boolean;
}

export enum SignalMonitorError {
  UNSUPPORTED_BROWSER = 'UNSUPPORTED_BROWSER',
  LOCATION_DENIED = 'LOCATION_DENIED',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  LOCATION_TIMEOUT = 'LOCATION_TIMEOUT',
  LOCATION_ERROR = 'LOCATION_ERROR'
}
