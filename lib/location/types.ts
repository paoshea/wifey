export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface LocationError {
  code: LocationErrorCode;
  message: string;
  originalError?: any;
}

export type LocationErrorCode = 
  | 'GEOLOCATION_NOT_SUPPORTED'
  | 'POSITION_ERROR'
  | 'WATCH_POSITION_ERROR'
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT';

export interface LocationServiceConfig {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
}
