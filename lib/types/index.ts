export interface CarrierCoverage {
  id: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  carrier: string;
  signalStrength: number;
  networkType: string;
  deviceId: string;
}

export interface StorageMetadata {
  version: number;
  lastCleanup: number;
  totalSize: number;
  quotaUsage: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface PendingPoint {
  id: string;
  data: Omit<CarrierCoverage, 'id'>;
  timestamp: number;
  retryCount: number;
  priority: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}
