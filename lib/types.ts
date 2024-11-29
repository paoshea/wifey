import type { CarrierCoverage } from './carriers/types';

export interface CoverageSearchResult {
  coverage: CarrierCoverage[];
  metadata: {
    totalResults: number;
    searchRadius: number;
    timestamp: string;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
}

export interface CoverageStats {
  totalMeasurements: number;
  averageSignalStrength: number;
  carrierBreakdown: {
    [key: string]: {
      measurements: number;
      averageSignal: number;
      technologies: {
        '2G'?: number;
        '3G'?: number;
        '4G'?: number;
        '5G'?: number;
      };
    };
  };
  timeRange: {
    start: string;
    end: string;
  };
}

export interface CoverageFilters {
  carriers?: string[];
  technologies?: ('2G' | '3G' | '4G' | '5G')[];
  minSignalStrength?: number;
  maxSignalStrength?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  verifiedOnly?: boolean;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewport {
  center: [number, number];
  zoom: number;
  bounds: MapBounds;
}
