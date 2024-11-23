import { performanceMonitor } from '../monitoring/performance';

interface CacheConfig {
  maxAge: number;  // Time in seconds
  staleWhileRevalidate: number;  // Time in seconds
  maxEntries?: number;  // Maximum number of entries to store
}

interface CacheEntry {
  data: any;
  timestamp: number;
  lastAccessed: number;
}

export class ApiCache {
  private static instance: ApiCache;
  private cache: Map<string, CacheEntry>;
  private config: CacheConfig;

  private constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = {
      maxAge: config.maxAge || 300, // 5 minutes default
      staleWhileRevalidate: config.staleWhileRevalidate || 600, // 10 minutes default
      maxEntries: config.maxEntries || 100,
    };

    // Periodic cleanup
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    }
  }

  static getInstance(config?: CacheConfig): ApiCache {
    if (!ApiCache.instance) {
      ApiCache.instance = new ApiCache(config || {
        maxAge: 300,
        staleWhileRevalidate: 600,
        maxEntries: 100,
      });
    }
    return ApiCache.instance;
  }

  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    config?: Partial<CacheConfig>
  ): Promise<T> {
    const mergedConfig = { ...this.config, ...config };
    const cacheKey = this.generateCacheKey(key);
    
    // Start performance monitoring
    performanceMonitor.startMark(`api_fetch_${cacheKey}`);

    try {
      // Check cache
      const cached = this.cache.get(cacheKey);
      const now = Date.now();

      if (cached) {
        // Update last accessed time
        cached.lastAccessed = now;

        // Check if cache is fresh
        if (now - cached.timestamp < mergedConfig.maxAge * 1000) {
          performanceMonitor.endMark(`api_fetch_${cacheKey}`, {
            source: 'cache',
            age: now - cached.timestamp,
          });
          return cached.data;
        }

        // Check if we can use stale data while revalidating
        if (now - cached.timestamp < mergedConfig.staleWhileRevalidate * 1000) {
          // Revalidate in background
          this.revalidate(cacheKey, fetcher, mergedConfig);
          
          performanceMonitor.endMark(`api_fetch_${cacheKey}`, {
            source: 'stale',
            age: now - cached.timestamp,
          });
          return cached.data;
        }
      }

      // Fetch fresh data
      const data = await this.fetchAndCache(cacheKey, fetcher, mergedConfig);
      
      performanceMonitor.endMark(`api_fetch_${cacheKey}`, {
        source: 'network',
      });
      
      return data;
    } catch (error) {
      performanceMonitor.endMark(`api_fetch_${cacheKey}`, {
        source: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async revalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<void> {
    try {
      const data = await fetcher();
      this.set(key, data, config);
    } catch (error) {
      console.error('Revalidation failed:', error);
    }
  }

  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    const data = await fetcher();
    this.set(key, data, config);
    return data;
  }

  private set(key: string, data: any, config: CacheConfig): void {
    // Ensure we don't exceed max entries
    if (config.maxEntries && this.cache.size >= config.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
    });
  }

  private evictOldest(): void {
    let oldest: [string, CacheEntry] | null = null;
    
    for (const entry of this.cache.entries()) {
      if (!oldest || entry[1].lastAccessed < oldest[1].lastAccessed) {
        oldest = entry;
      }
    }

    if (oldest) {
      this.cache.delete(oldest[0]);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.staleWhileRevalidate * 1000) {
        this.cache.delete(key);
      }
    }
  }

  private generateCacheKey(key: string): string {
    return `api_cache_${key}`;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    return {
      totalEntries: this.cache.size,
      freshEntries: entries.filter(([_, entry]) => 
        now - entry.timestamp < this.config.maxAge * 1000
      ).length,
      staleEntries: entries.filter(([_, entry]) => 
        now - entry.timestamp >= this.config.maxAge * 1000
      ).length,
      averageAge: entries.reduce((sum, [_, entry]) => 
        sum + (now - entry.timestamp), 0
      ) / (entries.length || 1),
      oldestEntry: Math.min(...entries.map(([_, entry]) => entry.timestamp)),
      newestEntry: Math.max(...entries.map(([_, entry]) => entry.timestamp)),
    };
  }

  // Clear the entire cache
  clear(): void {
    this.cache.clear();
  }

  // Remove a specific entry
  remove(key: string): void {
    const cacheKey = this.generateCacheKey(key);
    this.cache.delete(cacheKey);
  }

  // Check if an entry exists and is fresh
  isFresh(key: string): boolean {
    const cacheKey = this.generateCacheKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) return false;
    
    return Date.now() - entry.timestamp < this.config.maxAge * 1000;
  }

  // Check if an entry exists but is stale
  isStale(key: string): boolean {
    const cacheKey = this.generateCacheKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) return false;
    
    const age = Date.now() - entry.timestamp;
    return age >= this.config.maxAge * 1000 && 
           age < this.config.staleWhileRevalidate * 1000;
  }
}

export const apiCache = ApiCache.getInstance();
