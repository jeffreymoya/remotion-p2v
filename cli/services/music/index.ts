/**
 * Music services exports
 */

export * from './music-service';

import { MusicService } from './music-service';
import { ConfigManager } from '../../lib/config';
import { logger } from '../../utils/logger';

/**
 * Factory for creating music service instance
 */
export class MusicServiceFactory {
  private static instance: MusicService | null = null;

  /**
   * Get or create MusicService instance
   */
  static async getMusicService(): Promise<MusicService> {
    if (this.instance) {
      return this.instance;
    }

    // Load music config
    const config = await ConfigManager.loadMusicConfig();

    const pixabayKey = process.env.PIXABAY_API_KEY || config.pixabay?.apiKey;
    const localMusicDir = process.env.MUSIC_LIBRARY_PATH || config.localLibrary?.path;

    if (!pixabayKey && !localMusicDir) {
      logger.warn('No music sources configured. Music features will be disabled.');
      logger.warn('Set PIXABAY_API_KEY or MUSIC_LIBRARY_PATH in .env to enable background music.');
    }

    if (pixabayKey) logger.info('Initialized Pixabay Music service');
    if (localMusicDir) logger.info(`Initialized local music library: ${localMusicDir}`);

    this.instance = new MusicService(pixabayKey, localMusicDir);
    return this.instance;
  }

  /**
   * Clear cached instance
   */
  static clearCache(): void {
    this.instance = null;
  }
}
