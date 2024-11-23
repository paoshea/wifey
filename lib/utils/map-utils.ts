import L from 'leaflet';
import type { LatLng } from 'leaflet';
import type { SignalMeasurement } from '@/lib/types/monitoring';

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
export const coverageToHeatmapData = (measurements: SignalMeasurement[]): Array<[number, number, number]> => {
  return measurements.map(measurement => {
    const { lat, lng } = measurement.geolocation;
    return [lat, lng, measurement.signalStrength];
  });
};

// Calculate route optimization between two points considering coverage
export const optimizeRoute = (
  start: [number, number],
  end: [number, number],
  measurements: SignalMeasurement[]
): Array<[number, number]> => {
  // Create a grid of points between start and end
  const points: Array<[number, number]> = [];
  const steps = 10;
  
  for (let i = 0; i <= steps; i++) {
    const lat = start[0] + (end[0] - start[0]) * (i / steps);
    const lng = start[1] + (end[1] - start[1]) * (i / steps);
    points.push([lat, lng]);
  }

  // Find nearest coverage points and adjust route
  const optimizedRoute = points.map((point: [number, number]): [number, number] => {
    const nearest = findNearestCoveragePoint(point, measurements);
    return nearest ? [nearest.geolocation.lat, nearest.geolocation.lng] : point;
  });
  
  return optimizedRoute;
};

// Helper function to find nearest coverage point
export const findNearestCoveragePoint = (
  point: [number, number],
  measurements: SignalMeasurement[]
): SignalMeasurement | null => {
  if (!measurements.length) return null;

  let nearest = measurements[0];
  let minDistance = calculateDistance(
    point[0],
    point[1],
    nearest.geolocation.lat,
    nearest.geolocation.lng
  );

  for (const measurement of measurements) {
    const distance = calculateDistance(
      point[0],
      point[1],
      measurement.geolocation.lat,
      measurement.geolocation.lng
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = measurement;
    }
  }

  return nearest;
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
