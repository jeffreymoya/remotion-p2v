/**
 * Pixabay stock media service (images, videos, and music)
 * API Docs: https://pixabay.com/api/docs/
 */

import axios, { AxiosError } from 'axios';
import { StockImage, StockVideo, MusicTrack, ImageSearchOptions, VideoSearchOptions, StockAPIError, MusicMood } from '../../lib/media-types';
import { logger } from '../../utils/logger';

export class PixabayService {
  private apiKey: string;
  private baseUrl = 'https://pixabay.com/api';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Pixabay API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Search for images on Pixabay
   */
  async searchImages(query: string, options: ImageSearchOptions): Promise<StockImage[]> {
    try {
      logger.debug(`Searching Pixabay images for: ${query}`);

      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          q: query,
          per_page: options.perTag ?? 15,
          image_type: 'photo',
          orientation: options.orientation === '16:9' ? 'horizontal' : 'vertical',
        },
        timeout: 10000,
      });

      const images: StockImage[] = response.data.hits.map((image: any) => ({
        id: image.id.toString(),
        url: image.largeImageURL,
        downloadUrl: image.largeImageURL,
        source: 'pixabay' as const,
        tags: image.tags.split(', '),
        width: image.imageWidth,
        height: image.imageHeight,
        creator: image.user,
        licenseUrl: image.pageURL,
        attribution: `Image by ${image.user} from Pixabay`,
      }));

      logger.debug(`Found ${images.length} images from Pixabay`);
      return images;
    } catch (error) {
      return this.handleError(error, 'searchImages', query);
    }
  }

  /**
   * Search for videos on Pixabay
   */
  async searchVideos(query: string, options: VideoSearchOptions): Promise<StockVideo[]> {
    try {
      logger.debug(`Searching Pixabay videos for: ${query}`);

      const response = await axios.get(`${this.baseUrl}/videos/`, {
        params: {
          key: this.apiKey,
          q: query,
          per_page: options.perTag ?? 10,
        },
        timeout: 10000,
      });

      const videos: StockVideo[] = response.data.hits.map((video: any) => {
        // Find best quality video
        const videoFile = video.videos.large || video.videos.medium || video.videos.small;

        return {
          id: video.id.toString(),
          url: videoFile.url,
          downloadUrl: videoFile.url,
          source: 'pixabay' as const,
          tags: video.tags.split(', '),
          width: videoFile.width,
          height: videoFile.height,
          duration: video.duration,
          fps: 30, // Pixabay doesn't provide FPS, assume 30
          creator: video.user,
          licenseUrl: video.pageURL,
          attribution: `Video by ${video.user} from Pixabay`,
        };
      });

      logger.debug(`Found ${videos.length} videos from Pixabay`);
      return videos;
    } catch (error) {
      return this.handleError(error, 'searchVideos', query);
    }
  }

  /**
   * Search for music tracks on Pixabay
   */
  async searchMusic(mood: MusicMood, duration?: number): Promise<MusicTrack[]> {
    try {
      logger.debug(`Searching Pixabay music for mood: ${mood}`);

      // Use music API endpoint
      const response = await axios.get('https://pixabay.com/api/music/', {
        params: {
          key: this.apiKey,
          q: mood,
          per_page: 20,
        },
        timeout: 10000,
      });

      let tracks: MusicTrack[] = response.data.hits.map((track: any) => ({
        id: track.id.toString(),
        url: track.audio,
        source: 'pixabay' as const,
        title: track.name || `${mood} music`,
        duration: track.duration,
        mood,
        licenseUrl: track.pageURL,
        attribution: `Music from Pixabay`,
      }));

      // Filter by duration if specified (±30 seconds tolerance)
      if (duration) {
        tracks = tracks.filter(track => Math.abs(track.duration - duration) <= 30);
      }

      logger.debug(`Found ${tracks.length} music tracks from Pixabay`);
      return tracks;
    } catch (error) {
      return this.handleError(error, 'searchMusic', mood);
    }
  }

  /**
   * Handle API errors with appropriate logging and fallback
   */
  private handleError(error: unknown, method: string, query: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data || axiosError.message;

      if (status === 400) {
        throw new StockAPIError(
          'Pixabay API key invalid. Check PIXABAY_API_KEY in .env',
          'pixabay',
          status
        );
      }

      if (status === 429) {
        logger.warn('Pixabay rate limit exceeded (100 req/min)');
        throw new StockAPIError(
          'Pixabay rate limit exceeded (100 req/min, 5000 req/hour)',
          'pixabay',
          status
        );
      }

      if (status === 404 || (axiosError.response?.data as any)?.hits?.length === 0) {
        logger.warn(`No Pixabay results for query: ${query}`);
        return [] as any; // Return empty array for no results
      }

      logger.error(`Pixabay ${method} error:`, { status, message, query });
      throw new StockAPIError(
        `Pixabay API error: ${message}`,
        'pixabay',
        status,
        axiosError
      );
    }

    // Unknown error
    logger.error(`Pixabay ${method} unknown error:`, error);
    throw new StockAPIError(
      `Pixabay unexpected error: ${error}`,
      'pixabay',
      undefined,
      error as Error
    );
  }
}
