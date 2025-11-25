/**
 * TTS services exports
 */

export * from './google-tts';

import { GoogleTTSProvider } from './google-tts';
import { TTSProvider } from '../../lib/media-types';
import { ConfigManager } from '../../lib/config';
import { logger } from '../../utils/logger';

/**
 * Factory for creating TTS provider instances
 */
export class TTSProviderFactory {
  private static instance: TTSProvider | null = null;

  /**
   * Get or create TTS provider (defaults to Google TTS)
   */
  static async getTTSProvider(): Promise<TTSProvider> {
    if (this.instance) {
      return this.instance;
    }

    // Load TTS config
    const config = await ConfigManager.loadTTSConfig();

    // Default to Google TTS
    const googleApiKey = process.env.GOOGLE_TTS_API_KEY || config.google?.apiKey;

    if (!googleApiKey) {
      throw new Error(
        'Google TTS API key is required. Set GOOGLE_TTS_API_KEY in .env'
      );
    }

    logger.info('Initialized Google TTS provider');
    this.instance = new GoogleTTSProvider(googleApiKey);

    return this.instance;
  }

  /**
   * Clear cached instance
   */
  static clearCache(): void {
    this.instance = null;
  }
}
