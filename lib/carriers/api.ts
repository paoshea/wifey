import { CarrierCoverage, SupportedCarrier } from './types';
import { carrierConfigs } from './config';

export async function getCarrierCoverage(
  carrier: SupportedCarrier,
  lat: number,
  lng: number
): Promise<CarrierCoverage | null> {
  const config = carrierConfigs[carrier];
  if (!config || !config.apiKey) return null;

  try {
    const response = await fetch(
      `${config.baseUrl}/coverage?lat=${lat}&lng=${lng}`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Carrier API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      provider: carrier,
      signalStrength: data.signalStrength,
      technology: data.technology,
      location: { lat, lng },
      reliability: data.reliability
    };
  } catch (error) {
    console.error(`Error fetching coverage for ${carrier}:`, error);
    return null;
  }
}

export async function getAllCarriersCoverage(
  lat: number,
  lng: number
): Promise<CarrierCoverage[]> {
  const carriers: SupportedCarrier[] = ['kolbi_cr', 'movistar_cr', 'claro_cr', 'liberty_cr'];
  
  const coveragePromises = carriers.map(carrier => 
    getCarrierCoverage(carrier, lat, lng)
  );

  const results = await Promise.all(coveragePromises);
  return results.filter((result): result is CarrierCoverage => result !== null);
}