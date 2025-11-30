/**
 * Media services exports
 */

export * from './pexels';
export * from './unsplash';
export * from './pixabay';
export * from './stock-search';
export * from './quality';
export * from './deduplication';
export * from './downloader';
export * from './aspect-processor';

import { PexelsService } from './pexels';
import { UnsplashService } from './unsplash';
import { PixabayService } from './pixabay';
import { StockMediaSearch } from './stock-search';
import { MediaDownloader } from './downloader';
import { ConfigManager } from '../../lib/config';
import { logger } from '../../utils/logger';

/**
 * Factory for creating stock media search service with API keys from config
 */
export class MediaServiceFactory {
  private static searchInstance: StockMediaSearch | null = null;
  private static downloaderInstance: MediaDownloader | null = null;

  /**
   * Get or create StockMediaSearch instance
   */
  static async getStockMediaSearch(): Promise<StockMediaSearch> {
    if (this.searchInstance) {
      return this.searchInstance;
    }

    // Load API keys and config
    const config = await ConfigManager.loadStockAssetsConfig();

    const pexelsKey = process.env.PEXELS_API_KEY || config.providers?.pexels?.apiKey;
    // Support all common Unsplash env names (Access Key == App ID)
    const unsplashKey =
      process.env.UNSPLASH_API_KEY ||
      process.env.UNSPLASH_ACCESS_KEY ||
      process.env.UNSPLASH_APP_ID ||
      config.providers?.unsplash?.apiKey;
    const pixabayKey = process.env.PIXABAY_API_KEY || config.providers?.pixabay?.apiKey;

    if (!pexelsKey && !unsplashKey && !pixabayKey) {
      throw new Error(
        'At least one stock media API key is required. Set PEXELS_API_KEY, UNSPLASH_ACCESS_KEY (or UNSPLASH_APP_ID), or PIXABAY_API_KEY in .env'
      );
    }

    // Get search timeout from config (default 30s)
    const searchTimeoutMs = config.download?.timeoutMs ?? 30000;

    if (pexelsKey) logger.info('Initialized Pexels service');
    if (unsplashKey) logger.info('Initialized Unsplash service');
    if (pixabayKey) logger.info('Initialized Pixabay service');

    this.searchInstance = new StockMediaSearch(pexelsKey, unsplashKey, pixabayKey, searchTimeoutMs);
    return this.searchInstance;
  }

  /**
   * Get or create MediaDownloader instance
   */
  static getMediaDownloader(cacheDir?: string): MediaDownloader {
    if (!this.downloaderInstance) {
      this.downloaderInstance = new MediaDownloader(cacheDir);
    }
    return this.downloaderInstance;
  }

  /**
   * Clear cached instances
   */
  static clearCache(): void {
    this.searchInstance = null;
    this.downloaderInstance = null;
  }
}
