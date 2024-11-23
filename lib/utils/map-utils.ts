import L from 'leaflet';
import type { LatLng } from 'leaflet';
import { CarrierCoverage } from '../carriers/types';

// Custom marker icons for different signal strengths
export const getSignalIcon = (signalStrength: number): L.Icon => {
  let color = 'red';
  if (signalStrength >= 80) color = 'green';
  else if (signalStrength >= 60) color = 'blue';
  else if (signalStrength >= 40) color = 'orange';

  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// Convert coverage points to heatmap data format
export const coverageToHeatmapData = (coverage: CarrierCoverage[]): Array<[number, number, number]> => {
  return coverage.map(point => [
    point.location.lat,
    point.location.lng,
    point.signalStrength / 100, // Normalize to 0-1 range for intensity
  ] as [number, number, number]);
};

// Calculate route optimization between two points considering coverage
export const optimizeRoute = async (
  start: [number, number],
  end: [number, number],
  coverage: CarrierCoverage[]
): Promise<Array<[number, number]>> => {
  // Create a grid of points between start and end
  const points: Array<[number, number]> = [];
  const steps = 10;
  
  for (let i = 0; i <= steps; i++) {
    const lat = start[0] + (end[0] - start[0]) * (i / steps);
    const lng = start[1] + (end[1] - start[1]) * (i / steps);
    points.push([lat, lng]);
  }

  // Find nearest coverage points and adjust route
  const optimizedRoute = points.map(point => {
    const nearest = findNearestCoveragePoint(point, coverage);
    return nearest ? [nearest.location.lat, nearest.location.lng] as [number, number] : point;
  });

  return optimizedRoute;
};

// Helper function to find nearest coverage point
const findNearestCoveragePoint = (
  point: [number, number],
  coverage: CarrierCoverage[]
): CarrierCoverage | null => {
  let nearest: CarrierCoverage | null = null;
  let minDistance = Infinity;

  coverage.forEach(coveragePoint => {
    const distance = calculateDistance(
      point[0],
      point[1],
      coveragePoint.location.lat,
      coveragePoint.location.lng
    );

    if (distance < minDistance && coveragePoint.signalStrength >= 40) {
      minDistance = distance;
      nearest = coveragePoint;
    }
  });

  return nearest;
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
