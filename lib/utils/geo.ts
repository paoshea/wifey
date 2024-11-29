/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in meters
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
}

/**
 * Check if a point is within a given radius of another point
 * @param lat1 Latitude of center point in degrees
 * @param lon1 Longitude of center point in degrees
 * @param lat2 Latitude of point to check in degrees
 * @param lon2 Longitude of point to check in degrees
 * @param radius Radius in meters
 * @returns boolean indicating if point is within radius
 */
export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radius: number
): boolean {
  return getDistance(lat1, lon1, lat2, lon2) <= radius;
}

/**
 * Calculate the bounding box for a point and radius
 * @param lat Latitude of center point in degrees
 * @param lon Longitude of center point in degrees
 * @param radius Radius in meters
 * @returns Object containing min/max lat/lon values
 */
export function getBoundingBox(lat: number, lon: number, radius: number) {
  const R = 6371e3; // Earth's radius in meters
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const angularDistance = radius / R;

  const latMin = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
    Math.cos(latRad) * Math.sin(angularDistance) * -1
  );
  const latMax = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
    Math.cos(latRad) * Math.sin(angularDistance)
  );

  const lonMin =
    lonRad -
    Math.asin(Math.sin(angularDistance) / Math.cos(latRad));
  const lonMax =
    lonRad +
    Math.asin(Math.sin(angularDistance) / Math.cos(latRad));

  return {
    minLat: (latMin * 180) / Math.PI,
    maxLat: (latMax * 180) / Math.PI,
    minLon: (lonMin * 180) / Math.PI,
    maxLon: (lonMax * 180) / Math.PI,
  };
}
