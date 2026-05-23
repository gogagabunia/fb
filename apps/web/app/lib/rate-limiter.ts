/**
 * Sliding Window Rate Limiter (Zero Dependency, Thread-safe memory cache)
 */
class SlidingWindowRateLimiter {
  private cache = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowSeconds: number = 60, maxRequests: number = 5) {
    this.windowMs = windowSeconds * 1000;
    this.maxRequests = maxRequests;
  }

  /**
   * Determine if the key has exceeded the rate limit.
   */
  public limit(key: string): { success: boolean; limit: number; remaining: number; resetMs: number } {
    const now = Date.now();
    const timestamps = this.cache.get(key) || [];
    
    // Filter timestamps inside current sliding window
    const activeTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
    
    if (activeTimestamps.length >= this.maxRequests) {
      // Key is rate-limited
      const oldestActive = activeTimestamps[0];
      const resetMs = this.windowMs - (now - oldestActive);
      this.cache.set(key, activeTimestamps); // save filtered
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        resetMs: Math.max(0, resetMs),
      };
    }
    
    // Allow request
    activeTimestamps.push(now);
    this.cache.set(key, activeTimestamps);
    
    // Periodically clean cache to prevent memory leak
    this.cleanCache();

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - activeTimestamps.length,
      resetMs: this.windowMs,
    };
  }

  private cleanCache() {
    const now = Date.now();
    for (const [key, timestamps] of this.cache.entries()) {
      const active = timestamps.filter(ts => now - ts < this.windowMs);
      if (active.length === 0) {
        this.cache.delete(key);
      } else {
        this.cache.set(key, active);
      }
    }
  }
}

// Singleton instances for different endpoints
export const authRateLimiter = new SlidingWindowRateLimiter(60, 5); // 5 attempts per 60 seconds
export const apiRateLimiter = new SlidingWindowRateLimiter(10, 20);  // 20 requests per 10 seconds
