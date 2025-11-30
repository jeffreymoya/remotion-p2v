/**
 * TTS services exports
 */

export * from './google-tts';

import { GoogleTTSProvider } from './google-tts';
import { TTSProvider, TTSOptions, TTSResult, TTSError } from '../../lib/media-types';
import { ConfigManager } from '../../lib/config';
import { logger } from '../../utils/logger';
import { withRetry, withTimeout } from '../media/timeout-wrapper';

/**
 * Factory for creating TTS provider instances
 */
export class TTSProviderFactory {
  private static providers: Map<string, TTSProvider> = new Map();

  /**
   * Get or create a TTS provider by name
   */
  static async getProvider(name: string): Promise<TTSProvider> {
    // Return cached provider if exists
    if (this.providers.has(name)) {
      return this.providers.get(name)!;
    }

    // Load TTS config
    const config = await ConfigManager.loadTTSConfig();
    const providerConfig = config.providers?.[name];

    if (!providerConfig) {
      throw new Error(`TTS provider "${name}" not found in config`);
    }

    if (!providerConfig.enabled) {
      throw new Error(`TTS provider "${name}" is disabled in config`);
    }

    // Create provider instance
    let provider: TTSProvider;

    switch (name) {
      case 'google': {
        const apiKey = process.env.GOOGLE_TTS_API_KEY || providerConfig.apiKey;
        if (!apiKey) {
          throw new Error('Google TTS API key is required. Set GOOGLE_TTS_API_KEY in .env');
        }
        provider = new GoogleTTSProvider(apiKey, providerConfig);
        break;
      }

      case 'elevenlabs': {
        // ElevenLabs provider not yet implemented
        throw new Error('ElevenLabs provider not yet implemented');
      }

      default:
        throw new Error(`Unknown TTS provider: ${name}`);
    }

    logger.info(`Initialized ${name} TTS provider`);
    this.providers.set(name, provider);

    return provider;
  }

  /**
   * Get the default TTS provider from config
   */
  static async getTTSProvider(): Promise<TTSProvider> {
    const config = await ConfigManager.loadTTSConfig();
    const defaultProvider = config.defaultProvider || 'google';
    return this.getProvider(defaultProvider);
  }

  /**
   * Get list of available providers in fallback order
   */
  static async getFallbackProviders(): Promise<{ name: string; provider: TTSProvider }[]> {
    const config = await ConfigManager.loadTTSConfig();
    const fallbackOrder = config.fallbackOrder || [config.defaultProvider || 'google'];

    const providers: { name: string; provider: TTSProvider }[] = [];

    for (const name of fallbackOrder) {
      try {
        const provider = await this.getProvider(name);
        providers.push({ name, provider });
      } catch (error: any) {
        logger.warn(`Could not initialize ${name} provider: ${error.message}`);
      }
    }

    if (providers.length === 0) {
      throw new Error('No TTS providers available');
    }

    return providers;
  }

  /**
   * Clear all cached providers
   */
  static clearCache(): void {
    this.providers.clear();
  }
}

/**
 * Generate audio with retry logic and provider fallback
 */
export async function generateWithFallback(
  text: string,
  options?: TTSOptions
): Promise<{ audio: TTSResult; provider: string }> {
  const config = await ConfigManager.loadTTSConfig();
  const providers = await TTSProviderFactory.getFallbackProviders();
  const retryConfig = config.retryConfig || {
    maxRetries: 3,
    retryDelayMs: 1000,
    backoffMultiplier: 2,
  };
  const timeoutMs = config.timeoutMs || 60000;

  let lastError: Error | undefined;

  for (const { name, provider } of providers) {
    try {
      logger.info(`Attempting TTS generation with ${name}...`);

      // Wrap in retry and timeout
      const audio = await withRetry(
        async () => {
          return withTimeout(
            provider.generateAudio(text, options),
            timeoutMs,
            `TTS generation with ${name}`
          );
        },
        retryConfig,
        `TTS: ${name} - ${text.substring(0, 50)}...`
      );

      logger.info(`TTS succeeded with provider: ${name}`);
      return { audio, provider: name };
    } catch (error: any) {
      logger.warn(`TTS failed with ${name}: ${error.message}`);
      lastError = error;
      continue;
    }
  }

  throw new TTSError(
    `TTS failed with all providers. Last error: ${lastError?.message}`,
    'all',
    lastError
  );
}
