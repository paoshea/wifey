import { performanceMonitor } from '../monitoring/performance';

interface CacheConfig {
  maxAge: number;  // Time in seconds
  staleWhileRevalidate: number;  // Time in seconds
  maxEntries?: number;  // Maximum number of entries to store
  priority?: 'low' | 'medium' | 'high';  // Cache eviction priority
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;  // Track how often this entry is accessed
  priority: 'low' | 'medium' | 'high';
}

interface CacheStats {
  totalEntries: number;
  freshEntries: number;
  staleEntries: number;
  averageAccessCount: number;
  totalAccessCount: number;
  entriesByPriority: Record<'low' | 'medium' | 'high', number>;
}

export class ApiCache<T> {
  private static instance: ApiCache<any>;
  private cache: Map<string, CacheEntry<any>>;
  private config: Required<CacheConfig>;
  private prefetchQueue: Set<string> = new Set();

  private constructor(config: Partial<CacheConfig>) {
    this.cache = new Map();
    this.config = {
      maxAge: config.maxAge ?? 300, // 5 minutes default
      staleWhileRevalidate: config.staleWhileRevalidate ?? 600, // 10 minutes default
      maxEntries: config.maxEntries ?? 1000, // Increased default size
      priority: config.priority ?? 'medium'
    };

    // Periodic cleanup and prefetch
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60000); // Cleanup every minute
      setInterval(() => this.processPrefetchQueue(), 5000); // Process prefetch queue every 5 seconds
    }
  }

  static getInstance<T>(config?: Partial<CacheConfig>): ApiCache<T> {
    if (!ApiCache.instance) {
      ApiCache.instance = new ApiCache(config || {});
    }
    return ApiCache.instance as ApiCache<T>;
  }

  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    config?: Partial<CacheConfig>
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(key);
    const entry = this.cache.get(cacheKey) as CacheEntry<T> | undefined;

    if (entry) {
      entry.lastAccessed = Date.now();
      entry.accessCount++;

      if (this.isFresh(cacheKey)) {
        return entry.data;
      }

      if (this.isStale(cacheKey)) {
        this.revalidate(cacheKey, fetcher, { ...this.config, ...config });
        return entry.data;
      }
    }

    return this.fetchAndCache(cacheKey, fetcher, { ...this.config, ...config });
  }

  prefetch(key: string): void {
    this.prefetchQueue.add(this.generateCacheKey(key));
  }

  private async processPrefetchQueue(): Promise<void> {
    const keys = Array.from(this.prefetchQueue);
    this.prefetchQueue.clear();

    for (const key of keys) {
      const entry = this.cache.get(key);
      if (entry && this.shouldPrefetch(entry)) {
        // Prefetch logic here
      }
    }
  }

  private shouldPrefetch(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    const accessRate = entry.accessCount / (age / 1000); // accesses per second

    return accessRate > 0.1 && age > (this.config.maxAge * 1000 * 0.8);
  }

  private async revalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: Required<CacheConfig>
  ): Promise<void> {
    try {
      const data = await fetcher();
      this.set<T>(key, data, config);
    } catch (error) {
      console.error('Cache revalidation failed:', error);
    }
  }

  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: Required<CacheConfig>
  ): Promise<T> {
    try {
      const data = await fetcher();
      this.set<T>(key, data, config);
      return data;
    } catch (error) {
      console.error('Failed to fetch and cache:', error);
      throw error;
    }
  }

  private set<T>(key: string, data: T, config: Required<CacheConfig>): void {
    if (this.cache.size >= config.maxEntries) {
      this.evictEntries();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      priority: config.priority
    };

    this.cache.set(key, entry);
  }

  private evictEntries(): void {
    const expired = this.evictExpiredEntries();
    if (this.cache.size >= this.config.maxEntries) {
      const lru = this.evictLRUEntries();
      if (expired > 0 || lru > 0) {
        performanceMonitor.logEvent('cache-cleanup', {
          expired,
          lru,
          remainingEntries: this.cache.size
        });
      }
    }
  }

  private evictLRUEntries(): number {
    const targetSize = Math.floor(this.config.maxEntries * 0.9); // Remove 10% to prevent frequent evictions
    if (this.cache.size <= targetSize) return 0;

    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        entry,
        score: this.calculateEvictionScore(entry)
      }))
      .sort((a, b) => a.score - b.score);

    const toEvict = entries.slice(0, this.cache.size - targetSize);
    for (const { key } of toEvict) {
      this.cache.delete(key);
    }

    return toEvict.length;
  }

  private calculateEvictionScore(entry: CacheEntry<unknown>): number {
    const now = Date.now();
    const age = now - entry.timestamp;
    const priorityOrder: Record<'low' | 'medium' | 'high', number> = { 
      low: 0, 
      medium: 1, 
      high: 2 
    };
    return age + (priorityOrder[entry.priority] * 1000) + (entry.accessCount * 100);
  }

  private cleanup(): void {
    const expired = this.evictExpiredEntries();
    if (this.cache.size >= this.config.maxEntries) {
      const lru = this.evictLRUEntries();
      if (expired > 0 || lru > 0) {
        performanceMonitor.logEvent('cache-cleanup', {
          expired,
          lru,
          remainingEntries: this.cache.size
        });
      }
    }
  }

  isFresh(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    const age = now - entry.timestamp;
    return age < this.config.maxAge * 1000;
  }

  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    const age = now - entry.timestamp;
    const maxAge = this.config.maxAge * 1000;
    const staleWhileRevalidate = this.config.staleWhileRevalidate * 1000;
    
    return age >= maxAge && age < (maxAge + staleWhileRevalidate);
  }

  private evictExpiredEntries(): number {
    const now = Date.now();
    let evicted = 0;

    for (const [key, entry] of this.cache.entries()) {
      const expirationTime = entry.timestamp + (this.config.staleWhileRevalidate * 1000);
      if (now > expirationTime) {
        this.cache.delete(key);
        evicted++;
      }
    }

    return evicted;
  }

  private generateCacheKey(key: string): string {
    return `cache_${key}`;
  }

  // Get cache statistics
  getStats(): CacheStats {
    const now = Date.now();
    const stats: CacheStats = {
      totalEntries: this.cache.size,
      freshEntries: 0,
      staleEntries: 0,
      averageAccessCount: 0,
      totalAccessCount: 0,
      entriesByPriority: {
        low: 0,
        medium: 0,
        high: 0
      }
    };

    for (const entry of this.cache.values()) {
      stats.entriesByPriority[entry.priority]++;
      stats.totalAccessCount += entry.accessCount;
      
      if (now - entry.timestamp < this.config.maxAge * 1000) {
        stats.freshEntries++;
      } else {
        stats.staleEntries++;
      }
    }

    stats.averageAccessCount = stats.totalEntries > 0 
      ? stats.totalAccessCount / stats.totalEntries 
      : 0;

    return stats;
  }

  clear(): void {
    this.cache.clear();
    this.prefetchQueue.clear();
  }

  remove(key: string): void {
    this.cache.delete(this.generateCacheKey(key));
  }
}

export const apiCache = ApiCache.getInstance();
