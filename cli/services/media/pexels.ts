/**
 * Pexels stock media service
 * Using official Pexels JavaScript library
 * API Docs: https://www.pexels.com/api/documentation/
 */

import { createClient, Photo, Video, ErrorResponse } from 'pexels';
import { StockImage, StockVideo, ImageSearchOptions, VideoSearchOptions, StockAPIError } from '../../lib/media-types';
import { logger } from '../../utils/logger';

export class PexelsService {
  private client: ReturnType<typeof createClient>;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Pexels API key is required');
    }
    this.client = createClient(apiKey);
  }

  /**
   * Search for images on Pexels
   */
  async searchImages(query: string, options: ImageSearchOptions): Promise<StockImage[]> {
    try {
      logger.debug(`Searching Pexels images for: ${query}`);

      const response = await this.client.photos.search({
        query,
        per_page: options.perTag ?? 15,
        page: 1,
      });

      // Check for error response
      if ('error' in response) {
        throw new Error(response.error);
      }

      // Filter by orientation if specified
      let photos = response.photos;
      if (options.orientation) {
        photos = photos.filter(photo => {
          const aspectRatio = photo.width / photo.height;
          if (options.orientation === '16:9') {
            return aspectRatio >= 1.5; // Landscape
          } else {
            return aspectRatio < 1.5; // Portrait/square
          }
        });
      }

      const images: StockImage[] = photos.map((photo: Photo) => ({
        id: photo.id.toString(),
        url: photo.src.large2x,
        downloadUrl: photo.src.original,
        source: 'pexels' as const,
        tags: [query], // Pexels doesn't return tags in search, use query
        width: photo.width,
        height: photo.height,
        photographer: photo.photographer,
        licenseUrl: photo.url,
        attribution: `Photo by ${photo.photographer} on Pexels`,
      }));

      logger.debug(`Found ${images.length} images from Pexels`);
      return images;
    } catch (error) {
      // Handle "no results" case
      if ((error as any).isNoResults) {
        return [];
      }
      return this.handleError(error, 'searchImages', query);
    }
  }

  /**
   * Search for videos on Pexels
   */
  async searchVideos(query: string, options: VideoSearchOptions): Promise<StockVideo[]> {
    try {
      logger.debug(`Searching Pexels videos for: ${query}`);

      const params: any = {
        query,
        per_page: options.perTag ?? 10,
        page: 1,
      };

      // Add optional filters
      if (options.minDuration) {
        params.min_duration = options.minDuration;
      }
      if (options.maxDuration) {
        params.max_duration = options.maxDuration;
      }

      const response = await this.client.videos.search(params);

      // Check for error response
      if ('error' in response) {
        throw new Error(response.error);
      }

      // Filter by orientation if specified
      let videos = response.videos;
      if (options.orientation) {
        videos = videos.filter(video => {
          const aspectRatio = video.width / video.height;
          if (options.orientation === '16:9') {
            return aspectRatio >= 1.5; // Landscape
          } else {
            return aspectRatio < 1.5; // Portrait/square
          }
        });
      }

      const stockVideos: StockVideo[] = videos.map((video: Video) => {
        // Find best quality video file (prefer HD)
        const videoFile = video.video_files.find((f) => f.quality === 'hd') || video.video_files[0];

        return {
          id: video.id.toString(),
          url: videoFile.link,
          downloadUrl: videoFile.link,
          source: 'pexels' as const,
          tags: [query],
          width: videoFile.width ?? video.width,
          height: videoFile.height ?? video.height,
          duration: video.duration,
          fps: videoFile.fps ?? 30, // Use FPS from video file if available, default to 30
          creator: video.user.name,
          licenseUrl: video.url,
          attribution: `Video by ${video.user.name} on Pexels`,
        };
      });

      logger.debug(`Found ${stockVideos.length} videos from Pexels`);
      return stockVideos;
    } catch (error) {
      // Handle "no results" case
      if ((error as any).isNoResults) {
        return [];
      }
      return this.handleError(error, 'searchVideos', query);
    }
  }

  /**
   * Handle API errors with appropriate logging and fallback
   */
  private handleError(error: unknown, method: string, query: string): never {
    // Check if it's an ErrorResponse from the Pexels library
    if (this.isErrorResponse(error)) {
      logger.error(`Pexels ${method} error:`, { error: error.error, query });

      // Try to determine error type from message
      if (error.error.includes('Invalid API Key') || error.error.includes('401')) {
        throw new StockAPIError(
          'Pexels API key invalid. Check PEXELS_API_KEY in .env',
          'pexels',
          401
        );
      }

      if (error.error.includes('rate limit') || error.error.includes('429')) {
        logger.warn(`Pexels rate limit exceeded`);
        throw new StockAPIError(
          'Pexels rate limit exceeded (200 req/hour). Please try again later',
          'pexels',
          429
        );
      }

      if (error.error.includes('Not Found') || error.error.includes('404')) {
        logger.warn(`No Pexels results for query: ${query}`);
        // For 404, we want to return empty array, so throw a special error that will be caught
        const noResultsError = new Error('NO_RESULTS');
        (noResultsError as any).isNoResults = true;
        throw noResultsError;
      }

      throw new StockAPIError(
        `Pexels API error: ${error.error}`,
        'pexels',
        undefined
      );
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      logger.error(`Pexels ${method} error:`, { message: error.message, query });

      // Check for network errors or timeouts
      if (error.message.includes('timeout') || error.message.includes('network')) {
        throw new StockAPIError(
          `Pexels API network error: ${error.message}`,
          'pexels',
          undefined,
          error
        );
      }

      throw new StockAPIError(
        `Pexels API error: ${error.message}`,
        'pexels',
        undefined,
        error
      );
    }

    // Unknown error
    logger.error(`Pexels ${method} unknown error:`, error);
    throw new StockAPIError(
      `Pexels unexpected error: ${error}`,
      'pexels',
      undefined,
      error as Error
    );
  }

  /**
   * Type guard to check if response is an ErrorResponse
   */
  private isErrorResponse(obj: any): obj is ErrorResponse {
    return obj && typeof obj === 'object' && 'error' in obj && typeof obj.error === 'string';
  }
}
