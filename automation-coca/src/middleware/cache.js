// 🚀 ADVANCED CACHING LAYER
// Implementa: Redis-like in-memory cache, TTL, cache invalidation

const cache = new Map();

export class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  // Set cache entry with TTL (ms)
  set(key, value, ttl = 5 * 60 * 1000) {
    this.cache.set(key, value);

    // Clear previous timer if exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set new timer
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }

    return value;
  }

  // Get cache entry
  get(key) {
    return this.cache.get(key);
  }

  // Check if key exists
  has(key) {
    return this.cache.has(key);
  }

  // Delete specific key
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Get cache stats
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cacheManager = new CacheManager();

// Cache middleware factory
export const cacheMiddleware = (ttl = 5 * 60 * 1000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.method}:${req.path}`;
    const cached = cacheManager.get(cacheKey);

    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original send
    const originalSend = res.json.bind(res);

    // Override json to cache response
    res.json = function (data) {
      cacheManager.set(cacheKey, data, ttl);
      res.set('X-Cache', 'MISS');
      return originalSend(data);
    };

    next();
  };
};

// Cache invalidation patterns
export const invalidateCache = (patterns) => {
  const stats = cacheManager.stats();
  let invalidated = 0;

  for (const key of stats.keys) {
    for (const pattern of patterns) {
      if (key.includes(pattern)) {
        cacheManager.delete(key);
        invalidated++;
      }
    }
  }

  return { invalidated, remaining: cacheManager.size() };
};
