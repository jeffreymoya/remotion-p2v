/**
 * Rate Limiter for E2E Tests
 *
 * Prevents API rate limit violations during tests by:
 * - Tracking API calls in-memory during test run
 * - Implementing exponential backoff if limits approached
 * - Supporting different limits per provider
 * - Providing CLI flag to bypass for CI
 */

export interface RateLimitConfig {
  provider: string;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
}

/**
 * Rate limiter to prevent API quota violations during tests
 */
export class RateLimiter {
  // Store timestamps of API calls per provider
  private static callLog: Map<string, number[]> = new Map();

  // Flag to ignore rate limits (for CI environments)
  private static ignoreRateLimits = false;

  // Rate limit configurations per provider
  private static readonly rateLimits: Map<string, RateLimitConfig> = new Map([
    [
      'pexels',
      {
        provider: 'pexels',
        requestsPerMinute: 200,
        requestsPerDay: 20000, // Monthly limit divided by 30 days
      },
    ],
    [
      'unsplash',
      {
        provider: 'unsplash',
        requestsPerHour: 50,
      },
    ],
    [
      'pixabay',
      {
        provider: 'pixabay',
        requestsPerMinute: 100,
      },
    ],
    [
      'google-tts',
      {
        provider: 'google-tts',
        requestsPerMinute: 60, // Conservative limit
      },
    ],
  ]);

  /**
   * Throttle API calls based on rate limits
   * Will wait if necessary to avoid exceeding limits
   *
   * @param provider - The provider name (e.g., 'pexels', 'google-tts')
   */
  static async throttle(provider: string): Promise<void> {
    // Skip if rate limiting is disabled
    if (this.ignoreRateLimits) {
      this.recordCall(provider);
      return;
    }

    const config = this.rateLimits.get(provider.toLowerCase());
    if (!config) {
      console.warn(`⚠️  No rate limit configuration for provider: ${provider}`);
      this.recordCall(provider);
      return;
    }

    // Check if we can make the call
    while (!this.canMakeCall(provider)) {
      const waitTime = this.calculateWaitTime(provider, config);
      console.log(`⏳ Rate limit reached for ${provider}. Waiting ${waitTime}ms...`);
      await this.sleep(waitTime);
    }

    // Record the call
    this.recordCall(provider);
  }

  /**
   * Record an API call for rate limiting purposes
   *
   * @param provider - The provider name
   */
  static recordCall(provider: string): void {
    const normalizedProvider = provider.toLowerCase();
    const now = Date.now();

    if (!this.callLog.has(normalizedProvider)) {
      this.callLog.set(normalizedProvider, []);
    }

    const calls = this.callLog.get(normalizedProvider)!;
    calls.push(now);

    // Clean up old timestamps to prevent memory bloat
    this.cleanupOldTimestamps(normalizedProvider);
  }

  /**
   * Check if a call can be made without exceeding rate limits
   *
   * @param provider - The provider name
   * @returns True if the call can be made
   */
  static canMakeCall(provider: string): boolean {
    const normalizedProvider = provider.toLowerCase();
    const config = this.rateLimits.get(normalizedProvider);

    if (!config) {
      return true; // No limit configured
    }

    // Check per-minute limit
    if (config.requestsPerMinute) {
      const callsInLastMinute = this.getCallCount(normalizedProvider, 60 * 1000);
      if (callsInLastMinute >= config.requestsPerMinute) {
        return false;
      }
    }

    // Check per-hour limit
    if (config.requestsPerHour) {
      const callsInLastHour = this.getCallCount(normalizedProvider, 60 * 60 * 1000);
      if (callsInLastHour >= config.requestsPerHour) {
        return false;
      }
    }

    // Check per-day limit
    if (config.requestsPerDay) {
      const callsInLastDay = this.getCallCount(normalizedProvider, 24 * 60 * 60 * 1000);
      if (callsInLastDay >= config.requestsPerDay) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the number of API calls made in a given time window
   *
   * @param provider - The provider name
   * @param windowMs - The time window in milliseconds
   * @returns The number of calls made in the window
   */
  static getCallCount(provider: string, windowMs: number): number {
    const normalizedProvider = provider.toLowerCase();
    const calls = this.callLog.get(normalizedProvider) || [];
    const now = Date.now();
    const windowStart = now - windowMs;

    return calls.filter(timestamp => timestamp >= windowStart).length;
  }

  /**
   * Calculate how long to wait before making the next call
   *
   * @param provider - The provider name
   * @param config - The rate limit configuration
   * @returns Wait time in milliseconds
   */
  private static calculateWaitTime(provider: string, config: RateLimitConfig): number {
    const normalizedProvider = provider.toLowerCase();
    const calls = this.callLog.get(normalizedProvider) || [];

    if (calls.length === 0) {
      return 0;
    }

    const now = Date.now();
    let waitTime = 1000; // Default 1 second

    // Check per-minute limit
    if (config.requestsPerMinute) {
      const minuteAgo = now - 60 * 1000;
      const callsInLastMinute = calls.filter(t => t >= minuteAgo);

      if (callsInLastMinute.length >= config.requestsPerMinute) {
        // Wait until the oldest call in the window expires
        const oldestCall = Math.min(...callsInLastMinute);
        waitTime = Math.max(waitTime, oldestCall + 60 * 1000 - now);
      }
    }

    // Check per-hour limit
    if (config.requestsPerHour) {
      const hourAgo = now - 60 * 60 * 1000;
      const callsInLastHour = calls.filter(t => t >= hourAgo);

      if (callsInLastHour.length >= config.requestsPerHour) {
        const oldestCall = Math.min(...callsInLastHour);
        waitTime = Math.max(waitTime, oldestCall + 60 * 60 * 1000 - now);
      }
    }

    // Check per-day limit
    if (config.requestsPerDay) {
      const dayAgo = now - 24 * 60 * 60 * 1000;
      const callsInLastDay = calls.filter(t => t >= dayAgo);

      if (callsInLastDay.length >= config.requestsPerDay) {
        const oldestCall = Math.min(...callsInLastDay);
        waitTime = Math.max(waitTime, oldestCall + 24 * 60 * 60 * 1000 - now);
      }
    }

    // Add a small buffer
    return waitTime + 100;
  }

  /**
   * Clean up timestamps outside the maximum window we care about
   *
   * @param provider - The provider name
   */
  private static cleanupOldTimestamps(provider: string): void {
    const calls = this.callLog.get(provider);
    if (!calls) {
      return;
    }

    const now = Date.now();
    const maxWindow = 24 * 60 * 60 * 1000; // 24 hours (longest window)

    // Keep only calls within the max window
    const recentCalls = calls.filter(timestamp => now - timestamp < maxWindow);
    this.callLog.set(provider, recentCalls);
  }

  /**
   * Reset all rate limiting state
   * Useful for test isolation
   */
  static reset(): void {
    this.callLog.clear();
  }

  /**
   * Set whether to ignore rate limits
   *
   * @param ignore - True to ignore rate limits
   */
  static setIgnoreRateLimits(ignore: boolean): void {
    this.ignoreRateLimits = ignore;

    if (ignore) {
      console.log('⚠️  Rate limiting disabled');
    }
  }

  /**
   * Check if rate limiting is currently enabled
   *
   * @returns True if rate limiting is enabled
   */
  static isRateLimitingEnabled(): boolean {
    return !this.ignoreRateLimits;
  }

  /**
   * Get statistics about API calls for a provider
   *
   * @param provider - The provider name
   * @returns Statistics object
   */
  static getStats(provider: string): {
    totalCalls: number;
    callsLastMinute: number;
    callsLastHour: number;
    callsLastDay: number;
    canMakeCall: boolean;
  } {
    const normalizedProvider = provider.toLowerCase();

    return {
      totalCalls: (this.callLog.get(normalizedProvider) || []).length,
      callsLastMinute: this.getCallCount(normalizedProvider, 60 * 1000),
      callsLastHour: this.getCallCount(normalizedProvider, 60 * 60 * 1000),
      callsLastDay: this.getCallCount(normalizedProvider, 24 * 60 * 60 * 1000),
      canMakeCall: this.canMakeCall(normalizedProvider),
    };
  }

  /**
   * Print statistics for all providers
   */
  static printStats(): void {
    console.log('\n📊 Rate Limiter Statistics:');
    console.log('━'.repeat(80));

    for (const [provider, config] of this.rateLimits.entries()) {
      const stats = this.getStats(provider);

      console.log(`\n${config.provider.toUpperCase()}`);
      console.log(`  Total calls: ${stats.totalCalls}`);
      console.log(`  Last minute: ${stats.callsLastMinute}${config.requestsPerMinute ? ` / ${config.requestsPerMinute}` : ''}`);
      console.log(`  Last hour:   ${stats.callsLastHour}${config.requestsPerHour ? ` / ${config.requestsPerHour}` : ''}`);
      console.log(`  Last day:    ${stats.callsLastDay}${config.requestsPerDay ? ` / ${config.requestsPerDay}` : ''}`);
      console.log(`  Can call:    ${stats.canMakeCall ? '✅' : '❌'}`);
    }

    console.log('━'.repeat(80));
  }

  /**
   * Helper function to sleep for a given duration
   *
   * @param ms - Milliseconds to sleep
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Initialize rate limiter from environment variables
   * Checks for TEST_IGNORE_RATE_LIMITS env var
   */
  static initialize(): void {
    const ignoreEnv = process.env.TEST_IGNORE_RATE_LIMITS?.toLowerCase();
    if (ignoreEnv === 'true' || ignoreEnv === '1') {
      this.setIgnoreRateLimits(true);
    }
  }
}

// Auto-initialize on import
RateLimiter.initialize();
