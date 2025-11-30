/**
 * Media downloader with caching
 */

import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { StockImage, StockVideo, MusicTrack, MediaDownloadError, MediaCacheEntry } from '../../lib/media-types';
import { logger } from '../../utils/logger';
import { processAspectRatio, CropConfig } from './aspect-processor';
import { ConfigManager } from '../../lib/config';
import { withRetry } from './timeout-wrapper';

export class MediaDownloader {
  private cacheDir: string;

  constructor(cacheDir: string = 'cache/media') {
    this.cacheDir = cacheDir;
  }

  /**
   * Download a stock image with caching and calculate aspect-fit metadata
   */
  async downloadImage(image: StockImage): Promise<{ path: string; metadata: any }> {
    const localPath = await this.downloadMedia(image, image.downloadUrl);

    // Load crop config
    const stockConfig = await ConfigManager.loadStockAssetsConfig();
    const cropConfig: CropConfig = stockConfig.cropConfig || {
      safePaddingPercent: 10,
      maxAspectDelta: 0.3,
      targetWidth: 1920,
      targetHeight: 1080,
    };

    // Calculate aspect-fit metadata
    const cropResult = processAspectRatio(image.width, image.height, cropConfig);

    return {
      path: localPath,
      metadata: {
        width: image.width,
        height: image.height,
        mode: cropResult.mode,
        scale: cropResult.scale,
        cropX: cropResult.x,
        cropY: cropResult.y,
        cropWidth: cropResult.width,
        cropHeight: cropResult.height,
      },
    };
  }

  /**
   * Download a stock video with caching and calculate aspect-fit metadata
   */
  async downloadVideo(video: StockVideo): Promise<{ path: string; metadata: any }> {
    const localPath = await this.downloadMedia(video, video.downloadUrl);

    // Load crop config
    const stockConfig = await ConfigManager.loadStockAssetsConfig();
    const cropConfig: CropConfig = stockConfig.cropConfig || {
      safePaddingPercent: 10,
      maxAspectDelta: 0.3,
      targetWidth: 1920,
      targetHeight: 1080,
    };

    // Calculate aspect-fit metadata
    const cropResult = processAspectRatio(video.width, video.height, cropConfig);

    return {
      path: localPath,
      metadata: {
        width: video.width,
        height: video.height,
        duration: video.duration,
        mode: cropResult.mode,
        scale: cropResult.scale,
        cropX: cropResult.x,
        cropY: cropResult.y,
        cropWidth: cropResult.width,
        cropHeight: cropResult.height,
      },
    };
  }

  /**
   * Download a music track with caching
   */
  async downloadMusic(track: MusicTrack): Promise<string> {
    // Generate cache key from URL
    const hash = crypto.createHash('md5').update(track.url).digest('hex');
    const extension = '.mp3'; // Music is typically MP3
    const cacheKey = `${hash}${extension}`;
    const cachePath = path.join(this.cacheDir, cacheKey);

    // Check cache first
    if (await fs.pathExists(cachePath)) {
      logger.debug(`Cache hit for music track: ${track.title}`);
      return cachePath;
    }

    // Download with retry logic
    logger.info(`Downloading music track: ${track.title}`);

    // Load retry config from stock-assets config
    const stockConfig = await ConfigManager.loadStockAssetsConfig();
    const retryConfig = {
      maxRetries: stockConfig.download?.retryAttempts ?? 3,
      retryDelayMs: stockConfig.download?.retryDelayMs ?? 1000,
      backoffMultiplier: 2,
      exponentialBackoff: true,
    };
    const timeoutMs = 60000; // Music files need longer timeout

    try {
      await withRetry(
        async () => {
          const response = await axios.get(track.url, {
            responseType: 'arraybuffer',
            timeout: timeoutMs,
          });

          // Save to cache
          await fs.ensureDir(this.cacheDir);
          await fs.writeFile(cachePath, response.data);

          // Save metadata
          await this.saveMusicMetadata(cacheKey, track);
        },
        retryConfig,
        `Download music track: ${track.title}`
      );

      return cachePath;
    } catch (error: any) {
      throw new MediaDownloadError(
        `Failed to download music track after ${retryConfig.maxRetries} retries: ${error.message}`,
        track.url,
        error
      );
    }
  }

  /**
   * Generic media downloader
   */
  private async downloadMedia(media: StockImage | StockVideo, downloadUrl: string): Promise<string> {
    // Generate cache key from URL
    const hash = crypto.createHash('md5').update(downloadUrl).digest('hex');
    const extension = this.getExtension(downloadUrl);
    const cacheKey = `${hash}${extension}`;
    const cachePath = path.join(this.cacheDir, cacheKey);

    // Check cache first
    if (await fs.pathExists(cachePath)) {
      logger.debug(`Cache hit for media: ${media.id} from ${media.source}`);

      // Check if cache entry has expired (30 days)
      const metadata = await this.loadMetadata(cacheKey);
      if (metadata && new Date(metadata.expiresAt) < new Date()) {
        logger.debug(`Cache expired for media: ${media.id}, re-downloading`);
        await fs.remove(cachePath);
      } else {
        return cachePath;
      }
    }

    // Download with retry logic
    logger.info(`Downloading media: ${media.id} from ${media.source}`);

    // Load retry config from stock-assets config
    const stockConfig = await ConfigManager.loadStockAssetsConfig();
    const retryConfig = {
      maxRetries: stockConfig.download?.retryAttempts ?? 3,
      retryDelayMs: stockConfig.download?.retryDelayMs ?? 1000,
      backoffMultiplier: 2,
      exponentialBackoff: true,
    };
    const timeoutMs = stockConfig.download?.timeoutMs ?? 30000;

    try {
      await withRetry(
        async () => {
          const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: timeoutMs,
          });

          // Save to cache
          await fs.ensureDir(this.cacheDir);
          await fs.writeFile(cachePath, response.data);

          // Save metadata
          await this.saveMetadata(cacheKey, media, cachePath);
        },
        retryConfig,
        `Download ${media.id} from ${media.source}`
      );

      return cachePath;
    } catch (error: any) {
      throw new MediaDownloadError(
        `Failed to download media from ${media.source} after ${retryConfig.maxRetries} retries: ${error.message}`,
        downloadUrl,
        error
      );
    }
  }

  /**
   * Download multiple media items in parallel with concurrency control
   */
  async downloadBatch(
    mediaList: Array<StockImage | StockVideo>,
    options: { maxConcurrent?: number; onProgress?: (current: number, total: number) => void } = {}
  ): Promise<string[]> {
    const maxConcurrent = options.maxConcurrent ?? 5;
    const results: string[] = [];
    let completed = 0;

    // Download in batches to avoid overwhelming the system
    for (let i = 0; i < mediaList.length; i += maxConcurrent) {
      const batch = mediaList.slice(i, i + maxConcurrent);

      const batchResults = await Promise.allSettled(
        batch.map(media => {
          if ('photographer' in media) {
            return this.downloadImage(media as StockImage);
          } else {
            return this.downloadVideo(media as StockVideo);
          }
        })
      );

      // Collect successful downloads
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value.path);
        } else {
          logger.error('Download failed:', result.reason);
        }
      }

      completed += batch.length;
      options.onProgress?.(completed, mediaList.length);
    }

    return results;
  }

  /**
   * Save media metadata to cache
   */
  private async saveMetadata(
    cacheKey: string,
    media: StockImage | StockVideo,
    localPath: string
  ): Promise<void> {
    const metadataPath = path.join(this.cacheDir, `${cacheKey}.metadata.json`);

    const metadata: MediaCacheEntry = {
      id: media.id,
      source: media.source,
      url: media.url,
      downloadUrl: media.downloadUrl,
      tags: media.tags,
      width: media.width,
      height: media.height,
      attribution: media.attribution,
      licenseUrl: media.licenseUrl,
      downloadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      localPath,
    };

    await fs.writeJSON(metadataPath, metadata, { spaces: 2 });
  }

  /**
   * Save music metadata to cache
   */
  private async saveMusicMetadata(cacheKey: string, track: MusicTrack): Promise<void> {
    const metadataPath = path.join(this.cacheDir, `${cacheKey}.metadata.json`);

    const metadata = {
      id: track.id,
      source: track.source,
      url: track.url,
      title: track.title,
      duration: track.duration,
      mood: track.mood,
      attribution: track.attribution,
      licenseUrl: track.licenseUrl,
      downloadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days for music
    };

    await fs.writeJSON(metadataPath, metadata, { spaces: 2 });
  }

  /**
   * Load metadata from cache
   */
  private async loadMetadata(cacheKey: string): Promise<MediaCacheEntry | null> {
    const metadataPath = path.join(this.cacheDir, `${cacheKey}.metadata.json`);

    if (await fs.pathExists(metadataPath)) {
      return fs.readJSON(metadataPath);
    }

    return null;
  }

  /**
   * Get file extension from URL
   */
  private getExtension(url: string): string {
    const match = url.match(/\.(\w+)(\?|$)/);
    if (match) {
      return `.${match[1]}`;
    }

    // Default extensions based on common patterns
    if (url.includes('image') || url.includes('photo')) {
      return '.jpg';
    } else if (url.includes('video')) {
      return '.mp4';
    }

    return '.jpg'; // Default fallback
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    const files = await fs.readdir(this.cacheDir);
    let clearedCount = 0;

    for (const file of files) {
      if (file.endsWith('.metadata.json')) {
        const metadataPath = path.join(this.cacheDir, file);
        const metadata = await fs.readJSON(metadataPath);

        if (new Date(metadata.expiresAt) < new Date()) {
          // Remove both metadata and actual file
          const cacheKey = file.replace('.metadata.json', '');
          const mediaPath = path.join(this.cacheDir, cacheKey);

          await fs.remove(metadataPath);
          if (await fs.pathExists(mediaPath)) {
            await fs.remove(mediaPath);
          }

          clearedCount++;
          logger.debug(`Cleared expired cache: ${cacheKey}`);
        }
      }
    }

    if (clearedCount > 0) {
      logger.info(`Cleared ${clearedCount} expired cache entries`);
    }

    return clearedCount;
  }
}
