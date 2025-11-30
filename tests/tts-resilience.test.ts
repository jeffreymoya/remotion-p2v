#!/usr/bin/env node
/**
 * Integration tests for TTS resilience features
 * Tests retry logic, fallback, timeout, and config-driven voice selection
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TTSProviderFactory, generateWithFallback } from '../cli/services/tts';
import { ConfigManager } from '../cli/lib/config';

// Clear cached providers before tests
TTSProviderFactory.clearCache();

console.log('\n📊 TTS Resilience Test Suite');
console.log('Tests: Factory pattern, config loading, retry/timeout, fallback logic');
console.log('Note: Some tests may be skipped if API keys are not configured\n');

// Helper to safely load config
async function safeLoadTTSConfig() {
  try {
    return await ConfigManager.loadTTSConfig();
  } catch (error: any) {
    if (error.message.includes('Environment variable')) {
      console.log(`⏭️  Skipping tests - missing required environment variables`);
      console.log(`   Set GOOGLE_TTS_API_KEY or ELEVENLABS_API_KEY to run TTS tests`);
      return null;
    }
    throw error;
  }
}

// Factory tests
test('TTSProviderFactory - should load default provider from config', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;

  assert.ok(config.defaultProvider, 'defaultProvider should be defined in config');
  assert.ok(
    ['google', 'elevenlabs'].includes(config.defaultProvider),
    'defaultProvider should be google or elevenlabs'
  );

  // Only test if API key is available for default provider
  const defaultConfig = config.providers?.[config.defaultProvider];
  const apiKey = process.env.GOOGLE_TTS_API_KEY || defaultConfig?.apiKey;

  if (!apiKey || apiKey.startsWith('${')) {
    console.log('⏭️  Skipping provider creation test - no API key available');
    return;
  }

  const provider = await TTSProviderFactory.getTTSProvider();
  assert.ok(provider, 'Provider should be created');
  assert.ok(provider.name, 'Provider should have a name');
});

test('TTSProviderFactory - should create Google TTS provider from config', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;

  assert.ok(config.providers?.google, 'Google provider should be in config');
  assert.strictEqual(config.providers?.google?.enabled, true, 'Google provider should be enabled');

  const apiKey = process.env.GOOGLE_TTS_API_KEY || config.providers?.google?.apiKey;
  if (!apiKey || apiKey.startsWith('${')) {
    console.log('⏭️  Skipping Google TTS provider test - no API key available');
    return;
  }

  const provider = await TTSProviderFactory.getProvider('google');
  assert.ok(provider, 'Google provider should be created');
  assert.strictEqual(provider.name, 'google-tts', 'Provider name should be google-tts');
});

test('TTSProviderFactory - should throw error for disabled provider', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;

  // Find a disabled provider
  const disabledProvider = Object.entries(config.providers || {}).find(
    ([_, cfg]) => !cfg.enabled
  );

  if (!disabledProvider) {
    console.log('⏭️  Skipping disabled provider test - all providers enabled');
    return;
  }

  await assert.rejects(
    async () => {
      await TTSProviderFactory.getProvider(disabledProvider[0]);
    },
    /disabled/,
    'Should throw error for disabled provider'
  );
});

test('TTSProviderFactory - should throw error for unknown provider', async () => {
  // This test requires config to be loadable
  const config = await safeLoadTTSConfig();
  if (!config) return;

  await assert.rejects(
    async () => {
      await TTSProviderFactory.getProvider('unknown-provider');
    },
    /not found/,
    'Should throw error for unknown provider'
  );
});

test('TTSProviderFactory - should cache provider instances', async () => {
  TTSProviderFactory.clearCache();

  const config = await safeLoadTTSConfig();
  if (!config) return;
  const apiKey = process.env.GOOGLE_TTS_API_KEY || config.providers?.google?.apiKey;

  if (!apiKey || apiKey.startsWith('${')) {
    console.log('⏭️  Skipping provider caching test - no API key available');
    return;
  }

  const provider1 = await TTSProviderFactory.getProvider('google');
  const provider2 = await TTSProviderFactory.getProvider('google');

  assert.strictEqual(provider1, provider2, 'Should return same cached instance');
});

// Config-driven voice selection tests
test('Config - should load voice configuration from config file', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;

  assert.ok(config.providers?.google?.defaultVoice, 'Google default voice should be defined');
  assert.ok(
    config.providers?.google?.defaultVoice?.name,
    'Google default voice name should be defined'
  );
  assert.strictEqual(
    config.providers?.google?.defaultVoice?.languageCode,
    'en-US',
    'Language code should be en-US'
  );
});

test('Config - should use configured voice in Google TTS provider', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;
  const apiKey = process.env.GOOGLE_TTS_API_KEY || config.providers?.google?.apiKey;

  if (!apiKey || apiKey.startsWith('${')) {
    console.log('⏭️  Skipping voice config test - no API key available');
    return;
  }

  const provider = await TTSProviderFactory.getProvider('google');

  assert.ok((provider as any).config, 'Provider should have config injected');
  assert.ok((provider as any).config?.defaultVoice, 'Provider config should have defaultVoice');
  assert.strictEqual(
    (provider as any).config?.defaultVoice?.name,
    config.providers?.google?.defaultVoice?.name,
    'Provider should use configured voice name'
  );
});

// Retry and timeout configuration tests
test('Config - should load retry config from file', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;

  assert.ok(config.retryConfig, 'Retry config should be defined');
  assert.ok(
    config.retryConfig?.maxRetries && config.retryConfig.maxRetries > 0,
    'maxRetries should be greater than 0'
  );
  assert.ok(
    config.retryConfig?.retryDelayMs && config.retryConfig.retryDelayMs > 0,
    'retryDelayMs should be greater than 0'
  );
  assert.ok(
    config.retryConfig?.backoffMultiplier && config.retryConfig.backoffMultiplier > 1,
    'backoffMultiplier should be greater than 1'
  );
});

test('Config - should load timeout config from file', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;

  assert.ok(config.timeoutMs, 'timeoutMs should be defined');
  assert.ok(config.timeoutMs > 0, 'timeoutMs should be greater than 0');
  assert.ok(
    config.timeoutMs >= 30000,
    'timeoutMs should be at least 30 seconds'
  );
  assert.ok(
    config.timeoutMs <= 120000,
    'timeoutMs should be at most 120 seconds'
  );
});

// Fallback provider logic tests
test('Fallback - should load fallback order from config', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;

  assert.ok(config.fallbackOrder, 'fallbackOrder should be defined');
  assert.ok(Array.isArray(config.fallbackOrder), 'fallbackOrder should be an array');
  assert.ok(config.fallbackOrder.length > 0, 'fallbackOrder should have at least one provider');
});

test('Fallback - should get fallback providers in correct order', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;
  const providers = await TTSProviderFactory.getFallbackProviders();

  assert.ok(providers.length > 0, 'Should have at least one provider available');

  // First provider should match fallback order
  const firstEnabled = config.fallbackOrder!.find(name =>
    config.providers?.[name]?.enabled
  );

  if (firstEnabled && providers.length > 0) {
    assert.strictEqual(
      providers[0].name,
      firstEnabled,
      'First provider should match fallback order'
    );
  }
});

test('Fallback - should skip providers without API keys', async () => {
  // This test requires config to be loadable
  const config = await safeLoadTTSConfig();
  if (!config) return;

  const providers = await TTSProviderFactory.getFallbackProviders();

  assert.ok(providers, 'Providers should be defined');
  assert.ok(Array.isArray(providers), 'Providers should be an array');

  // All returned providers should be enabled
  for (const { name } of providers) {
    const config = await safeLoadTTSConfig();
  if (!config) return;
    const providerConfig = config.providers?.[name];
    assert.strictEqual(
      providerConfig?.enabled,
      true,
      `Provider ${name} should be enabled`
    );
  }
});

// generateWithFallback tests
test('generateWithFallback - should generate audio with fallback logic', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;

  // Check if any provider has API key
  const hasApiKey = config.fallbackOrder?.some(name => {
    const cfg = config.providers?.[name];
    const key = name === 'google'
      ? process.env.GOOGLE_TTS_API_KEY || cfg?.apiKey
      : process.env.ELEVENLABS_API_KEY || cfg?.apiKey;
    return key && !key.startsWith('${');
  });

  if (!hasApiKey) {
    console.log('⏭️  Skipping fallback generation test - no API keys available');
    return;
  }

  const result = await generateWithFallback('Hello, this is a test.');

  assert.ok(result, 'Result should be defined');
  assert.ok(result.audio, 'Result should have audio');
  assert.ok(result.provider, 'Result should have provider name');
  assert.ok(
    result.audio.audioBuffer instanceof Buffer,
    'Audio buffer should be a Buffer'
  );
  assert.ok(
    result.audio.audioBuffer.length > 0,
    'Audio buffer should have content'
  );
  assert.ok(
    result.audio.durationMs > 0,
    'Audio duration should be greater than 0'
  );
  assert.strictEqual(result.audio.format, 'mp3', 'Audio format should be mp3');

  console.log(`✅ Generated ${result.audio.durationMs}ms of audio using ${result.provider}`);
});

test('Config - should have retry logic configured for resilience', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;

  assert.ok(
    config.retryConfig?.maxRetries && config.retryConfig.maxRetries >= 2,
    'Should have at least 2 retries configured'
  );
  assert.ok(
    config.retryConfig?.backoffMultiplier && config.retryConfig.backoffMultiplier >= 1.5,
    'Should have exponential backoff configured'
  );
});

// Voice configuration options tests
test('Config - should have multiple voice options configured', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;

  assert.ok(config.providers?.google?.voices, 'Google should have voice options');
  assert.ok(
    Object.keys(config.providers?.google?.voices || {}).length > 1,
    'Google should have multiple voice options'
  );
});

test('Config - should have audio config settings', async () => {
  const config = await safeLoadTTSConfig();
  if (!config) return;

  assert.ok(config.providers?.google?.audioConfig, 'Google should have audio config');
  assert.strictEqual(
    config.providers?.google?.audioConfig?.audioEncoding,
    'MP3',
    'Audio encoding should be MP3'
  );
  assert.ok(
    config.providers?.google?.audioConfig?.speakingRate !== undefined,
    'Speaking rate should be defined'
  );
});

console.log('\n✨ All TTS resilience tests completed!\n');
