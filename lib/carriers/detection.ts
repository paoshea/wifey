import { SignalMeasurement } from '../monitoring/signal-monitor';

interface MobileCarrier {
  id: string;
  name: string;
  mcc: string;
  mnc: string[];
  networks: {
    type: '2G' | '3G' | '4G' | '5G';
    bands: string[];
  }[];
}

// Costa Rica carriers (as per the project's initial focus)
const CARRIERS: MobileCarrier[] = [
  {
    id: 'kolbi_cr',
    name: 'Kölbi',
    mcc: '712',
    mnc: ['01', '02'],
    networks: [
      {
        type: '2G',
        bands: ['850', '1800'],
      },
      {
        type: '3G',
        bands: ['850', '2100'],
      },
      {
        type: '4G',
        bands: ['1800', '2600'],
      },
      {
        type: '5G',
        bands: ['3500'],
      },
    ],
  },
  {
    id: 'movistar_cr',
    name: 'Movistar',
    mcc: '712',
    mnc: ['04'],
    networks: [
      {
        type: '2G',
        bands: ['850', '1800'],
      },
      {
        type: '3G',
        bands: ['850'],
      },
      {
        type: '4G',
        bands: ['1800'],
      },
    ],
  },
  {
    id: 'claro_cr',
    name: 'Claro',
    mcc: '712',
    mnc: ['03'],
    networks: [
      {
        type: '2G',
        bands: ['1800'],
      },
      {
        type: '3G',
        bands: ['2100'],
      },
      {
        type: '4G',
        bands: ['1800'],
      },
    ],
  },
  {
    id: 'liberty_cr',
    name: 'Liberty',
    mcc: '712',
    mnc: ['20'],
    networks: [
      {
        type: '4G',
        bands: ['1800', '2600'],
      },
      {
        type: '5G',
        bands: ['3500'],
      },
    ],
  },
];

interface CarrierDetectionResult {
  carrierId: string;
  confidence: number;
  method: 'network-info' | 'location' | 'fallback';
}

async function detectFromNetworkInfo(): Promise<CarrierDetectionResult | null> {
  try {
    // Try to use the Network Information API
    const connection = (navigator as any).connection;
    if (connection?.type === 'cellular') {
      // Some browsers expose carrier info
      if (connection.carrier) {
        const carrier = CARRIERS.find(c => 
          c.name.toLowerCase().includes(connection.carrier.toLowerCase())
        );
        if (carrier) {
          return {
            carrierId: carrier.id,
            confidence: 0.9,
            method: 'network-info'
          };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function detectFromLocation(
  location: { lat: number; lng: number }
): Promise<CarrierDetectionResult | null> {
  // This would typically involve checking against a coverage database
  // For now, we'll return null as this requires additional infrastructure
  return null;
}

export async function detectCarrier(
  measurement: SignalMeasurement
): Promise<string> {
  // Try network info first
  const networkResult = await detectFromNetworkInfo();
  if (networkResult && networkResult.confidence && networkResult.confidence > 0.8) {
    return networkResult.carrierId;
  }

  // Try location-based detection
  const locationResult = await detectFromLocation(measurement.geolocation);
  if (locationResult && locationResult.confidence && locationResult.confidence > 0.8) {
    return locationResult.carrierId;
  }

  // Fallback to the most likely carrier based on market share
  return 'kolbi_cr'; // Kölbi has the largest market share in Costa Rica
}

export function getCarrierInfo(carrierId: string): MobileCarrier | undefined {
  return CARRIERS.find(c => c.id === carrierId);
}

export function getSupportedBands(
  carrierId: string,
  technology: '2G' | '3G' | '4G' | '5G'
): string[] {
  const carrier = CARRIERS.find(c => c.id === carrierId);
  const network = carrier?.networks.find(n => n.type === technology);
  return network?.bands || [];
}

export function getAllCarriers(): MobileCarrier[] {
  return [...CARRIERS];
}
