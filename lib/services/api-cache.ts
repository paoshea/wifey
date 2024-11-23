import { performanceMonitor } from '../monitoring/performance';

interface CacheConfig {
  maxAge: number;  // Time in seconds
  staleWhileRevalidate: number;  // Time in seconds
  maxEntries?: number;  // Maximum number of entries to store
  priority?: 'low' | 'medium' | 'high';  // Cache eviction priority
}

interface CacheEntry {
  data: any;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;  // Track how often this entry is accessed
  priority: 'low' | 'medium' | 'high';
}

export class ApiCache {
  private static instance: ApiCache;
  private cache: Map<string, CacheEntry>;
  private config: CacheConfig;
  private prefetchQueue: Set<string> = new Set();

  private constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = {
      maxAge: config.maxAge || 300, // 5 minutes default
      staleWhileRevalidate: config.staleWhileRevalidate || 600, // 10 minutes default
      maxEntries: config.maxEntries || 1000, // Increased default size
    };

    // Periodic cleanup and prefetch
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60000); // Cleanup every minute
      setInterval(() => this.processPrefetchQueue(), 5000); // Process prefetch queue every 5 seconds
    }
  }

  static getInstance(config?: CacheConfig): ApiCache {
    if (!ApiCache.instance) {
      ApiCache.instance = new ApiCache(config || {
        maxAge: 300,
        staleWhileRevalidate: 600,
        maxEntries: 1000,
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
    
    performanceMonitor.startMark(`api_fetch_${cacheKey}`);

    try {
      const cached = this.cache.get(cacheKey);
      const now = Date.now();

      if (cached) {
        // Update access statistics
        cached.lastAccessed = now;
        cached.accessCount++;

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

  // Add to prefetch queue
  prefetch(key: string): void {
    this.prefetchQueue.add(this.generateCacheKey(key));
  }

  // Process prefetch queue
  private async processPrefetchQueue(): Promise<void> {
    const keys = Array.from(this.prefetchQueue);
    this.prefetchQueue.clear();

    for (const key of keys) {
      const cached = this.cache.get(key);
      if (cached && this.shouldPrefetch(cached)) {
        try {
          await this.revalidate(key, cached.data.fetcher, {
            ...this.config,
            priority: cached.priority,
          });
        } catch (error) {
          console.error('Prefetch failed:', error);
        }
      }
    }
  }

  // Determine if an entry should be prefetched based on access patterns
  private shouldPrefetch(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    
    // Prefetch if:
    // 1. Entry is accessed frequently (more than 5 times)
    // 2. Entry is about to expire (within 20% of maxAge)
    // 3. Entry has high priority
    return (
      entry.accessCount > 5 ||
      age > (this.config.maxAge * 0.8 * 1000) ||
      entry.priority === 'high'
    );
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
      this.evictEntries();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      priority: config.priority || 'low',
    });
  }

  // Improved cache eviction strategy
  private evictEntries(): void {
    // First try to evict expired entries
    let evicted = this.evictExpiredEntries();
    
    // If we still need to evict more, use LRU + priority + access count
    if (this.cache.size >= (this.config.maxEntries || 1000)) {
      evicted = this.evictLRUEntries();
    }

    // Log eviction statistics
    if (evicted > 0) {
      console.debug(`Cache evicted ${evicted} entries`);
    }
  }

  private evictExpiredEntries(): number {
    const now = Date.now();
    let evicted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.staleWhileRevalidate * 1000) {
        this.cache.delete(key);
        evicted++;
      }
    }

    return evicted;
  }

  private evictLRUEntries(): number {
    // Sort entries by priority and last accessed time
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => {
        // First sort by priority
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        const priorityDiff = priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by access count
        const accessDiff = b[1].accessCount - a[1].accessCount;
        if (accessDiff !== 0) return accessDiff;
        
        // Finally by last accessed time
        return b[1].lastAccessed - a[1].lastAccessed;
      });

    // Remove 25% of entries
    const removeCount = Math.ceil(this.cache.size * 0.25);
    let evicted = 0;

    for (let i = 0; i < removeCount && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
      evicted++;
    }

    return evicted;
  }

  private generateCacheKey(key: string): string {
    return `cache_${key}`;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    const stats = {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      entriesByPriority: {
        low: 0,
        medium: 0,
        high: 0,
      },
      freshEntries: 0,
      staleEntries: 0,
      averageAccessCount: 0,
      totalAccessCount: 0,
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

    stats.averageAccessCount = stats.totalAccessCount / this.cache.size;
    return stats;
  }

  clear(): void {
    this.cache.clear();
    this.prefetchQueue.clear();
  }

  remove(key: string): void {
    this.cache.delete(this.generateCacheKey(key));
  }

  isFresh(key: string): boolean {
    const entry = this.cache.get(this.generateCacheKey(key));
    if (!entry) return false;
    return Date.now() - entry.timestamp < this.config.maxAge * 1000;
  }

  isStale(key: string): boolean {
    const entry = this.cache.get(this.generateCacheKey(key));
    if (!entry) return false;
    const age = Date.now() - entry.timestamp;
    return age > this.config.maxAge * 1000 && age < this.config.staleWhileRevalidate * 1000;
  }
}

export const apiCache = ApiCache.getInstance();
