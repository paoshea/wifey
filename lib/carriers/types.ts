export interface CarrierCoverage {
  [key: string]: unknown;  // Allow any type for dynamic properties
  provider: string;
  signalStrength: number;
  technology: '2G' | '3G' | '4G' | '5G';
  location: {
    lat: number;
    lng: number;
  };
  reliability?: number;
  metadata?: Record<string, unknown>;
}

export interface CarrierAPIConfig {
  baseUrl: string;
  apiKey: string;
  country: string;
}

export type SupportedCarrier =
  | 'kolbi_cr'   // Kölbi (ICE) - Costa Rica
  | 'movistar_cr' // Movistar - Costa Rica
  | 'claro_cr'    // Claro - Costa Rica
  | 'liberty_cr'; // Liberty - Costa Rica