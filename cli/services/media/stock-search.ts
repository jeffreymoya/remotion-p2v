/**
 * Unified stock media search service
 * Coordinates searches across Pexels, Unsplash, and Pixabay
 */

import { PexelsService } from './pexels';
import { UnsplashService } from './unsplash';
import { PixabayService } from './pixabay';
import {
  StockImage,
  StockVideo,
  ImageSearchOptions,
  VideoSearchOptions,
  MediaAsset
} from '../../lib/media-types';
import { logger } from '../../utils/logger';

export class StockMediaSearch {
  private pexelsService?: PexelsService;
  private unsplashService?: UnsplashService;
  private pixabayService?: PixabayService;

  constructor(
    pexelsApiKey?: string,
    unsplashApiKey?: string,
    pixabayApiKey?: string
  ) {
    // Initialize only services with valid API keys
    if (pexelsApiKey) {
      this.pexelsService = new PexelsService(pexelsApiKey);
    }
    if (unsplashApiKey) {
      this.unsplashService = new UnsplashService(unsplashApiKey);
    }
    if (pixabayApiKey) {
      this.pixabayService = new PixabayService(pixabayApiKey);
    }

    if (!this.pexelsService && !this.unsplashService && !this.pixabayService) {
      throw new Error('At least one stock media API key is required (Pexels, Unsplash, or Pixabay)');
    }
  }

  /**
   * Search for images across all available services
   */
  async searchImages(tags: string[], options: ImageSearchOptions): Promise<StockImage[]> {
    logger.info(`Searching for images with tags: ${tags.join(', ')}`);

    const searchPromises = tags.map(async (tag) => {
      const results = await Promise.allSettled([
        this.pexelsService ? this.searchPexelsImages(tag, options) : Promise.resolve([]),
        this.unsplashService ? this.searchUnsplashImages(tag, options) : Promise.resolve([]),
        this.pixabayService ? this.searchPixabayImages(tag, options) : Promise.resolve([]),
      ]);

      // Collect all successful results
      const images: StockImage[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          images.push(...result.value);
        } else {
          logger.warn(`Stock image search failed for tag: ${tag}`, { error: result.reason });
        }
      }

      return images;
    });

    const allResults = await Promise.all(searchPromises);
    const flattenedResults = allResults.flat();

    logger.info(`Found ${flattenedResults.length} total images before deduplication`);

    return flattenedResults;
  }

  /**
   * Search for videos across Pexels and Pixabay (Unsplash doesn't have videos)
   */
  async searchVideos(tags: string[], options: VideoSearchOptions): Promise<StockVideo[]> {
    logger.info(`Searching for videos with tags: ${tags.join(', ')}`);

    const searchPromises = tags.map(async (tag) => {
      const results = await Promise.allSettled([
        this.pexelsService ? this.searchPexelsVideos(tag, options) : Promise.resolve([]),
        this.pixabayService ? this.searchPixabayVideos(tag, options) : Promise.resolve([]),
      ]);

      const videos: StockVideo[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          videos.push(...result.value);
        } else {
          logger.warn(`Stock video search failed for tag: ${tag}`, { error: result.reason });
        }
      }

      return videos;
    });

    const allResults = await Promise.all(searchPromises);
    const flattenedResults = allResults.flat();

    logger.info(`Found ${flattenedResults.length} total videos before deduplication`);

    return flattenedResults;
  }

  /**
   * Search for both images and videos
   */
  async searchMedia(
    tags: string[],
    imageOptions: ImageSearchOptions,
    videoOptions: VideoSearchOptions
  ): Promise<{ images: StockImage[], videos: StockVideo[] }> {
    const [images, videos] = await Promise.all([
      this.searchImages(tags, imageOptions),
      this.searchVideos(tags, videoOptions),
    ]);

    return { images, videos };
  }

  /**
   * Private helpers for rate-limited searches
   */
  private async searchPexelsImages(tag: string, options: ImageSearchOptions): Promise<StockImage[]> {
    if (!this.pexelsService) return [];
    try {
      return await this.pexelsService.searchImages(tag, options);
    } catch (error: any) {
      // Graceful degradation - log error and continue
      logger.warn(`Pexels image search failed: ${error.message}`);
      return [];
    }
  }

  private async searchUnsplashImages(tag: string, options: ImageSearchOptions): Promise<StockImage[]> {
    if (!this.unsplashService) return [];
    try {
      return await this.unsplashService.searchImages(tag, options);
    } catch (error: any) {
      logger.warn(`Unsplash image search failed: ${error.message}`);
      return [];
    }
  }

  private async searchPixabayImages(tag: string, options: ImageSearchOptions): Promise<StockImage[]> {
    if (!this.pixabayService) return [];
    try {
      return await this.pixabayService.searchImages(tag, options);
    } catch (error: any) {
      logger.warn(`Pixabay image search failed: ${error.message}`);
      return [];
    }
  }

  private async searchPexelsVideos(tag: string, options: VideoSearchOptions): Promise<StockVideo[]> {
    if (!this.pexelsService) return [];
    try {
      return await this.pexelsService.searchVideos(tag, options);
    } catch (error: any) {
      logger.warn(`Pexels video search failed: ${error.message}`);
      return [];
    }
  }

  private async searchPixabayVideos(tag: string, options: VideoSearchOptions): Promise<StockVideo[]> {
    if (!this.pixabayService) return [];
    try {
      return await this.pixabayService.searchVideos(tag, options);
    } catch (error: any) {
      logger.warn(`Pixabay video search failed: ${error.message}`);
      return [];
    }
  }
}
