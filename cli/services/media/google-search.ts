/**
 * Google Custom Search API client for image search
 * API Docs: https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

/**
 * Google Custom Search image result
 */
export interface GoogleImageResult {
  url: string;
  width: number;
  height: number;
  format: string;
  thumbnailUrl: string;
  contextUrl: string; // webpage where image was found
}

/**
 * Error class for Google Custom Search API failures
 */
export class GoogleSearchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'GoogleSearchError';
  }
}

/**
 * Google Custom Search API client
 */
export class GoogleSearchClient {
  private readonly baseUrl = 'https://customsearch.googleapis.com/customsearch/v1';
  private readonly apiKey: string;
  private readonly searchEngineId: string;
  private readonly client: AxiosInstance;
  private readonly maxRetries = 3;
  private readonly timeout = 10000; // 10 seconds

  constructor(apiKey: string, searchEngineId: string) {
    if (!apiKey) {
      throw new Error('Google Custom Search API key is required');
    }
    if (!searchEngineId) {
      throw new Error('Google Custom Search Engine ID is required');
    }

    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Search for images using Google Custom Search API
   * @param query - Search query string
   * @param count - Number of results to return (max 10)
   * @returns Array of image results
   */
  async searchImages(query: string, count: number = 10): Promise<GoogleImageResult[]> {
    if (!query || query.trim().length === 0) {
      throw new GoogleSearchError('Search query cannot be empty');
    }

    if (count < 1 || count > 10) {
      throw new GoogleSearchError('Count must be between 1 and 10');
    }

    logger.debug(`Searching Google for images: ${query}`);

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.get('', {
          params: {
            key: this.apiKey,
            cx: this.searchEngineId,
            q: query,
            searchType: 'image',
            num: count,
            imgSize: 'xxlarge',
            safe: 'off',
          },
        });

        // Parse and validate response
        const items = response.data?.items;
        if (!items || !Array.isArray(items)) {
          logger.warn(`No results returned for query: ${query}`);
          return [];
        }

        const results = this.parseImageResults(items);
        logger.debug(`Found ${results.length} images from Google Custom Search`);
        return results;

      } catch (error: any) {
        lastError = error;

        // Handle rate limiting (429)
        if (error.response?.status === 429) {
          logger.error(`Google Custom Search rate limit exceeded`);
          throw new GoogleSearchError(
            'Google Custom Search rate limit exceeded. Please try again later',
            429,
            error
          );
        }

        // Handle quota exceeded (403)
        if (error.response?.status === 403) {
          const errorMessage = error.response?.data?.error?.message || '';
          if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
            logger.error(`Google Custom Search quota exceeded`);
            throw new GoogleSearchError(
              'Google Custom Search quota exceeded. Check your API usage',
              403,
              error
            );
          }
        }

        // Handle authentication errors (401)
        if (error.response?.status === 401) {
          logger.error(`Google Custom Search authentication failed`);
          throw new GoogleSearchError(
            'Google Custom Search API key is invalid. Check GOOGLE_CUSTOM_SEARCH_API_KEY',
            401,
            error
          );
        }

        // Handle invalid search engine ID (400)
        if (error.response?.status === 400) {
          const errorMessage = error.response?.data?.error?.message || '';
          if (errorMessage.includes('cx')) {
            logger.error(`Invalid Google Custom Search Engine ID`);
            throw new GoogleSearchError(
              'Invalid Search Engine ID. Check GOOGLE_CUSTOM_SEARCH_ENGINE_ID',
              400,
              error
            );
          }
        }

        // Handle timeout errors
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          logger.warn(`Google Custom Search timeout (attempt ${attempt}/${this.maxRetries})`);
          if (attempt < this.maxRetries) {
            await this.exponentialBackoff(attempt);
            continue;
          }
          throw new GoogleSearchError(
            'Google Custom Search request timed out after multiple attempts',
            undefined,
            error
          );
        }

        // Handle network errors
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('network')) {
          logger.warn(`Google Custom Search network error (attempt ${attempt}/${this.maxRetries})`);
          if (attempt < this.maxRetries) {
            await this.exponentialBackoff(attempt);
            continue;
          }
          throw new GoogleSearchError(
            'Google Custom Search network error after multiple attempts',
            undefined,
            error
          );
        }

        // For other errors, retry if we have attempts left
        if (attempt < this.maxRetries) {
          logger.warn(`Google Custom Search error (attempt ${attempt}/${this.maxRetries}): ${error.message}`);
          await this.exponentialBackoff(attempt);
          continue;
        }

        // If all retries exhausted, throw error
        break;
      }
    }

    // If we get here, all retries failed
    logger.error(`Google Custom Search failed after ${this.maxRetries} attempts:`, lastError);
    throw new GoogleSearchError(
      `Google Custom Search failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
      undefined,
      lastError
    );
  }

  /**
   * Parse image results from Google API response
   */
  private parseImageResults(items: any[]): GoogleImageResult[] {
    const results: GoogleImageResult[] = [];

    for (const item of items) {
      try {
        // Validate required fields
        if (!item.link || !item.image) {
          continue;
        }

        const imageData = item.image;
        const width = parseInt(imageData.width, 10);
        const height = parseInt(imageData.height, 10);

        // Skip if dimensions are invalid
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
          continue;
        }

        // Determine format from URL extension
        const format = this.extractImageFormat(item.link);

        results.push({
          url: item.link,
          width,
          height,
          format,
          thumbnailUrl: imageData.thumbnailLink || item.link,
          contextUrl: imageData.contextLink || item.link,
        });
      } catch (error) {
        logger.warn(`Failed to parse image result:`, error);
        continue;
      }
    }

    return results;
  }

  /**
   * Extract image format from URL
   */
  private extractImageFormat(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();

      if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
        return 'jpeg';
      }
      if (pathname.endsWith('.png')) {
        return 'png';
      }
      if (pathname.endsWith('.webp')) {
        return 'webp';
      }
      if (pathname.endsWith('.avif')) {
        return 'avif';
      }
      if (pathname.endsWith('.gif')) {
        return 'gif';
      }

      // Default to jpeg if format cannot be determined
      return 'jpeg';
    } catch {
      return 'jpeg';
    }
  }

  /**
   * Exponential backoff delay between retries
   */
  private async exponentialBackoff(attempt: number): Promise<void> {
    const baseDelay = 1000; // 1 second
    const delay = baseDelay * Math.pow(2, attempt - 1);
    logger.debug(`Waiting ${delay}ms before retry...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Create a Google Search client from environment variables
 */
export function createGoogleSearchClient(): GoogleSearchClient {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey) {
    throw new GoogleSearchError(
      'GOOGLE_CUSTOM_SEARCH_API_KEY environment variable is not set'
    );
  }

  if (!searchEngineId) {
    throw new GoogleSearchError(
      'GOOGLE_CUSTOM_SEARCH_ENGINE_ID environment variable is not set'
    );
  }

  return new GoogleSearchClient(apiKey, searchEngineId);
}
