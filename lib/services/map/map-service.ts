import { CarrierCoverage } from '@/lib/carriers/types';
import localforage from 'localforage';

// Initialize localforage instance for map data
const mapStore = localforage.createInstance({
  name: 'wifeyMap',
  storeName: 'coverageData',
});

interface AreaBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface CacheEntry {
  data: CarrierCoverage[];
  timestamp: number;
  bounds: AreaBounds;
}

const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

export class MapService {
  static async getCoverageData(bounds: AreaBounds): Promise<CarrierCoverage[]> {
    // Try to get data from cache first
    const cachedData = await this.getCachedData(bounds);
    if (cachedData) {
      return cachedData;
    }

    // If not in cache, fetch from API
    const data = await this.fetchCoverageData(bounds);
    await this.cacheData(bounds, data);
    return data;
  }

  static async getCachedData(bounds: AreaBounds): Promise<CarrierCoverage[] | null> {
    try {
      const cacheKey = this.getBoundsCacheKey(bounds);
      const cached = await mapStore.getItem<CacheEntry>(cacheKey);

      if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRY) {
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  static async cacheData(bounds: AreaBounds, data: CarrierCoverage[]): Promise<void> {
    try {
      const cacheKey = this.getBoundsCacheKey(bounds);
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
        bounds,
      };
      await mapStore.setItem(cacheKey, cacheEntry);
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  static async fetchCoverageData(bounds: AreaBounds): Promise<CarrierCoverage[]> {
    const response = await fetch(
      `/api/coverage/cellular/area?minLat=${bounds.minLat}&maxLat=${bounds.maxLat}&minLng=${bounds.minLng}&maxLng=${bounds.maxLng}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch coverage data');
    }

    return response.json();
  }

  static async clearCache(): Promise<void> {
    try {
      await mapStore.clear();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  private static getBoundsCacheKey(bounds: AreaBounds): string {
    // Round coordinates to reduce cache fragmentation
    const precision = 2;
    return `coverage:${bounds.minLat.toFixed(precision)},${bounds.maxLat.toFixed(precision)},${bounds.minLng.toFixed(precision)},${bounds.maxLng.toFixed(precision)}`;
  }
}
