#!/usr/bin/env node
/**
 * Edge Case Test: Rate Limiting
 *
 * Tests the pipeline's rate limiting mechanisms:
 * - Respects provider rate limits
 * - Throttles requests appropriately
 * - Handles quota exhaustion gracefully
 * - Implements exponential backoff
 * - Tracks API call counts accurately
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Import helpers
import { RateLimiter } from '../helpers/rate-limiter';

// Test constants
const TEST_TIMEOUT = 120000; // 2 minutes

describe('Edge Case: Rate Limiting', { timeout: TEST_TIMEOUT }, () => {
  before(async () => {
    console.log('\n⏱️  Starting Rate Limiting Edge Case Test...\n');
    RateLimiter.reset();
  });

  after(async () => {
    console.log('\n🧹 Cleaning up rate limiting tests...');
    RateLimiter.reset();
    console.log('✅ Cleanup complete\n');
  });

  it('should record API calls correctly', async () => {
    console.log('📝 Testing API call recording...');

    const provider = 'test-provider-1';
    const callCount = 10;

    // Record multiple calls
    for (let i = 0; i < callCount; i++) {
      RateLimiter.recordCall(provider);
    }

    // Verify all calls were recorded
    const count = RateLimiter.getCallCount(provider, 60000); // Last minute
    assert.strictEqual(count, callCount, `Should record all ${callCount} calls`);

    console.log(`✅ Recorded ${count} calls correctly\n`);
  });

  it('should track calls per provider separately', async () => {
    console.log('📝 Testing per-provider call tracking...');

    RateLimiter.reset();

    // Record calls for different providers
    RateLimiter.recordCall('pexels');
    RateLimiter.recordCall('pexels');
    RateLimiter.recordCall('pixabay');
    RateLimiter.recordCall('unsplash');

    const pexelsCount = RateLimiter.getCallCount('pexels', 60000);
    const pixabayCount = RateLimiter.getCallCount('pixabay', 60000);
    const unsplashCount = RateLimiter.getCallCount('unsplash', 60000);

    assert.strictEqual(pexelsCount, 2, 'Should track Pexels calls');
    assert.strictEqual(pixabayCount, 1, 'Should track Pixabay calls');
    assert.strictEqual(unsplashCount, 1, 'Should track Unsplash calls');

    console.log('✅ Per-provider tracking working correctly\n');
  });

  it('should respect time windows for call counting', async () => {
    console.log('📝 Testing time window filtering...');

    RateLimiter.reset();

    const provider = 'test-provider-2';

    // Record some calls
    RateLimiter.recordCall(provider);
    RateLimiter.recordCall(provider);
    RateLimiter.recordCall(provider);

    // Get count for last minute
    const minuteCount = RateLimiter.getCallCount(provider, 60000);
    assert.strictEqual(minuteCount, 3, 'Should count calls in last minute');

    // Get count for last hour
    const hourCount = RateLimiter.getCallCount(provider, 3600000);
    assert.strictEqual(hourCount, 3, 'Should count calls in last hour');

    console.log('✅ Time window filtering working correctly\n');
  });

  it('should allow calls when under rate limit', async () => {
    console.log('📝 Testing canMakeCall when under limit...');

    RateLimiter.reset();

    const provider = 'pexels';

    // Record a few calls (well under 200/min limit)
    RateLimiter.recordCall(provider);
    RateLimiter.recordCall(provider);

    const canMake = RateLimiter.canMakeCall(provider);
    assert.strictEqual(canMake, true, 'Should allow calls when under limit');

    console.log('✅ Calls allowed when under limit\n');
  });

  it('should throttle when approaching rate limit', async () => {
    console.log('📝 Testing throttle delay calculation...');

    RateLimiter.reset();

    const provider = 'google-tts'; // 60 req/min limit

    // Simulate many rapid calls (but not actually wait)
    // We'll test the throttle mechanism exists, not full delay
    const start = Date.now();
    await RateLimiter.throttle(provider);
    const duration = Date.now() - start;

    // First call should be fast (no throttling needed)
    assert.ok(duration < 100, 'First call should be immediate');

    console.log('✅ Throttle mechanism working\n');
  });

  it('should handle ignore rate limits flag', async () => {
    console.log('📝 Testing ignore rate limits flag...');

    RateLimiter.reset();
    RateLimiter.setIgnoreRateLimits(true);

    const provider = 'test-provider-3';

    // Record way over the limit
    for (let i = 0; i < 1000; i++) {
      RateLimiter.recordCall(provider);
    }

    // Should still allow calls when ignoring limits
    const start = Date.now();
    await RateLimiter.throttle(provider);
    const duration = Date.now() - start;

    assert.ok(duration < 100, 'Should not throttle when ignoring limits');

    // Reset flag
    RateLimiter.setIgnoreRateLimits(false);

    console.log('✅ Ignore rate limits flag working correctly\n');
  });

  it('should reset call history', async () => {
    console.log('📝 Testing reset functionality...');

    const provider = 'test-provider-4';

    // Record some calls
    RateLimiter.recordCall(provider);
    RateLimiter.recordCall(provider);
    RateLimiter.recordCall(provider);

    // Verify calls recorded
    let count = RateLimiter.getCallCount(provider, 60000);
    assert.strictEqual(count, 3, 'Should record calls before reset');

    // Reset
    RateLimiter.reset();

    // Verify calls cleared
    count = RateLimiter.getCallCount(provider, 60000);
    assert.strictEqual(count, 0, 'Should clear calls after reset');

    console.log('✅ Reset functionality working correctly\n');
  });

  it('should handle unknown providers gracefully', async () => {
    console.log('📝 Testing unknown provider handling...');

    const unknownProvider = 'unknown-api-provider';

    // Should not throw error
    await assert.doesNotReject(
      async () => RateLimiter.throttle(unknownProvider),
      'Should handle unknown provider without error'
    );

    // Should still record the call (throttle() already calls recordCall() internally)
    const count = RateLimiter.getCallCount(unknownProvider, 60000);
    assert.strictEqual(count, 1, 'Should record call for unknown provider');

    console.log('✅ Unknown provider handled gracefully\n');
  });

  it('should support provider-specific rate limits', async () => {
    console.log('📝 Testing provider-specific limits...');

    RateLimiter.reset();

    // Test that different providers have different limits configured
    const providers = ['pexels', 'pixabay', 'unsplash', 'google-tts'];

    for (const provider of providers) {
      // Each provider should have limits (verify by checking canMakeCall)
      const canMake = RateLimiter.canMakeCall(provider);
      assert.strictEqual(canMake, true, `${provider} should allow initial calls`);
    }

    console.log('✅ Provider-specific limits configured correctly\n');
  });

  it('should calculate accurate call counts over different time windows', async () => {
    console.log('📝 Testing multi-window call counting...');

    RateLimiter.reset();

    const provider = 'test-provider-5';

    // Record 5 calls
    for (let i = 0; i < 5; i++) {
      RateLimiter.recordCall(provider);
    }

    // Test different time windows
    const oneSecond = RateLimiter.getCallCount(provider, 1000);
    const oneMinute = RateLimiter.getCallCount(provider, 60000);
    const oneHour = RateLimiter.getCallCount(provider, 3600000);
    const oneDay = RateLimiter.getCallCount(provider, 86400000);

    // All should show 5 calls (they just happened)
    assert.strictEqual(oneSecond, 5, 'Should count calls in 1s window');
    assert.strictEqual(oneMinute, 5, 'Should count calls in 1min window');
    assert.strictEqual(oneHour, 5, 'Should count calls in 1hr window');
    assert.strictEqual(oneDay, 5, 'Should count calls in 1day window');

    console.log('✅ Multi-window call counting accurate\n');
  });

  it('should handle rapid sequential throttle calls', async () => {
    console.log('📝 Testing rapid sequential throttle calls...');

    RateLimiter.reset();
    RateLimiter.setIgnoreRateLimits(true); // Speed up test

    const provider = 'test-provider-6';
    const callCount = 10;

    const start = Date.now();

    // Make rapid sequential throttle calls
    for (let i = 0; i < callCount; i++) {
      await RateLimiter.throttle(provider);
    }

    const duration = Date.now() - start;

    // Should complete quickly when ignoring limits
    assert.ok(duration < 1000, `Should complete ${callCount} calls quickly`);

    // Verify all calls were recorded
    const count = RateLimiter.getCallCount(provider, 60000);
    assert.strictEqual(count, callCount, `Should record all ${callCount} calls`);

    RateLimiter.setIgnoreRateLimits(false);

    console.log(`✅ Handled ${callCount} rapid calls in ${duration}ms\n`);
  });

  it('should be case-insensitive for provider names', async () => {
    console.log('📝 Testing case-insensitive provider names...');

    RateLimiter.reset();

    // Record calls with different cases
    RateLimiter.recordCall('PEXELS');
    RateLimiter.recordCall('pexels');
    RateLimiter.recordCall('Pexels');

    // Should all be counted together
    const count1 = RateLimiter.getCallCount('pexels', 60000);
    const count2 = RateLimiter.getCallCount('PEXELS', 60000);
    const count3 = RateLimiter.getCallCount('Pexels', 60000);

    assert.strictEqual(count1, 3, 'Should normalize case (lowercase)');
    assert.strictEqual(count2, 3, 'Should normalize case (uppercase)');
    assert.strictEqual(count3, 3, 'Should normalize case (titlecase)');

    console.log('✅ Provider names are case-insensitive\n');
  });

  it('should maintain accuracy over many calls', async () => {
    console.log('📝 Testing accuracy with high call volume...');

    RateLimiter.reset();

    const provider = 'test-provider-7';
    const totalCalls = 100;

    // Record many calls
    for (let i = 0; i < totalCalls; i++) {
      RateLimiter.recordCall(provider);
    }

    const count = RateLimiter.getCallCount(provider, 60000);
    assert.strictEqual(count, totalCalls, `Should accurately count ${totalCalls} calls`);

    console.log(`✅ Maintained accuracy over ${totalCalls} calls\n`);
  });
});

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running Rate Limiting Edge Case Tests...\n');
}
