export interface SignalMeasurement {
  id?: string;  // Optional for new measurements
  timestamp: number;
  carrier: string;
  network: string;
  networkType: string;
  geolocation: {
    lat: number;
    lng: number;
  };  
  signalStrength: number;
  technology: '2G' | '3G' | '4G' | '5G';
  provider: string;
  connectionType?: string;
  isRoaming?: boolean;
}
