/**
 * Unsplash stock image service
 * Using official unsplash-js library
 * API Docs: https://unsplash.com/documentation
 * Note: unsplash-js library is archived but still functional
 */

import { createApi } from 'unsplash-js';
import type { Basic } from 'unsplash-js/dist/methods/photos/types';
import { StockImage, ImageSearchOptions, StockAPIError } from '../../lib/media-types';
import { logger } from '../../utils/logger';

export class UnsplashService {
  private api: ReturnType<typeof createApi>;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Unsplash API key is required');
    }
    this.api = createApi({
      accessKey: apiKey,
    });
  }

  /**
   * Search for images on Unsplash
   */
  async searchImages(query: string, options: ImageSearchOptions): Promise<StockImage[]> {
    try {
      logger.debug(`Searching Unsplash images for: ${query}`);

      const result = await this.api.search.getPhotos({
        query,
        perPage: options.perTag ?? 15,
        page: 1,
        orientation: options.orientation === '16:9' ? 'landscape' : options.orientation === '9:16' ? 'portrait' : undefined,
      });

      // Check for errors
      if (result.errors) {
        throw new Error(result.errors.join(', '));
      }

      // Handle empty response
      if (!result.response) {
        logger.warn(`No Unsplash results for query: ${query}`);
        return [];
      }

      const photos = result.response.results;

      const images: StockImage[] = photos.map((photo: Basic) => {
        // Try to extract tags if available (not in official types but may exist in API response)
        const photoWithTags = photo as Basic & { tags?: Array<{ title: string }> };
        const tags = photoWithTags.tags?.map((t) => t.title) || [query];

        return {
          id: photo.id,
          url: photo.urls.regular,
          downloadUrl: photo.urls.raw,
          source: 'unsplash' as const,
          tags,
          width: photo.width,
          height: photo.height,
          photographer: photo.user.name,
          licenseUrl: photo.links.html,
          attribution: `Photo by ${photo.user.name} on Unsplash`,
        };
      });

      logger.debug(`Found ${images.length} images from Unsplash`);
      return images;
    } catch (error) {
      // Handle "no results" case
      if ((error as any).isNoResults) {
        return [];
      }
      return this.handleError(error, query);
    }
  }

  /**
   * Handle API errors with appropriate logging and fallback
   */
  private handleError(error: unknown, query: string): never {
    if (error instanceof Error) {
      logger.error(`Unsplash API error:`, { message: error.message, query });

      // Check for common error patterns in message
      if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
        throw new StockAPIError(
          'Unsplash API key invalid. Check UNSPLASH_ACCESS_KEY / UNSPLASH_APP_ID in .env',
          'unsplash',
          401
        );
      }

      if (error.message.includes('403') || error.message.toLowerCase().includes('rate limit')) {
        logger.error('Unsplash rate limit exceeded (50 req/hour on free tier)');
        throw new StockAPIError(
          'Unsplash rate limit exceeded (50 req/hour free tier, 5000 req/hour production)',
          'unsplash',
          403
        );
      }

      if (error.message.includes('404') || error.message.toLowerCase().includes('not found')) {
        logger.warn(`No Unsplash results for query: ${query}`);
        // For 404, we want to return empty array, so throw a special error that will be caught
        const noResultsError = new Error('NO_RESULTS');
        (noResultsError as any).isNoResults = true;
        throw noResultsError;
      }

      // Check for network errors
      if (error.message.includes('timeout') || error.message.includes('network')) {
        throw new StockAPIError(
          `Unsplash API network error: ${error.message}`,
          'unsplash',
          undefined,
          error
        );
      }

      throw new StockAPIError(
        `Unsplash API error: ${error.message}`,
        'unsplash',
        undefined,
        error
      );
    }

    // Unknown error
    logger.error(`Unsplash unknown error:`, error);
    throw new StockAPIError(
      `Unsplash unexpected error: ${error}`,
      'unsplash',
      undefined,
      error as Error
    );
  }
}
