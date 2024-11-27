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

export enum SignalMonitorErrorType {
  UNSUPPORTED_BROWSER = 'UNSUPPORTED_BROWSER',
  LOCATION_DENIED = 'LOCATION_DENIED',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  LOCATION_TIMEOUT = 'LOCATION_TIMEOUT',
  LOCATION_ERROR = 'LOCATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class SignalMonitorError extends Error {
  static UNSUPPORTED_BROWSER = new SignalMonitorError(SignalMonitorErrorType.UNSUPPORTED_BROWSER, 'Browser does not support required features');
  static LOCATION_DENIED = new SignalMonitorError(SignalMonitorErrorType.LOCATION_DENIED, 'Location access denied');
  static PERMISSION_ERROR = new SignalMonitorError(SignalMonitorErrorType.PERMISSION_ERROR, 'Permission error');
  static LOCATION_UNAVAILABLE = new SignalMonitorError(SignalMonitorErrorType.LOCATION_UNAVAILABLE, 'Location unavailable');
  static LOCATION_TIMEOUT = new SignalMonitorError(SignalMonitorErrorType.LOCATION_TIMEOUT, 'Location request timed out');
  static LOCATION_ERROR = new SignalMonitorError(SignalMonitorErrorType.LOCATION_ERROR, 'Location error');
  static NETWORK_ERROR = new SignalMonitorError(SignalMonitorErrorType.NETWORK_ERROR, 'Network error');
  static UNKNOWN_ERROR = new SignalMonitorError(SignalMonitorErrorType.UNKNOWN_ERROR, 'Unknown error');

  constructor(
    public type: SignalMonitorErrorType,
    message: string
  ) {
    super(message);
    this.name = 'SignalMonitorError';
    Object.setPrototypeOf(this, SignalMonitorError.prototype);
  }
}
