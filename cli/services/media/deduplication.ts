/**
 * Media deduplication service
 * Uses simple URL and dimension-based deduplication (no perceptual hashing for now)
 */

import { StockImage, StockVideo } from '../../lib/media-types';
import { logger } from '../../utils/logger';

/**
 * Deduplicate images based on URL and dimensions
 */
export function deduplicateImages(images: StockImage[]): StockImage[] {
  const seen = new Map<string, StockImage>();

  for (const image of images) {
    // Create unique key: source + id (most reliable)
    const key = `${image.source}:${image.id}`;

    if (!seen.has(key)) {
      seen.set(key, image);
    } else {
      // If duplicate, keep higher resolution version
      const existing = seen.get(key)!;
      const existingResolution = existing.width * existing.height;
      const currentResolution = image.width * image.height;

      if (currentResolution > existingResolution) {
        seen.set(key, image);
      }
    }
  }

  const deduplicated = Array.from(seen.values());
  const removedCount = images.length - deduplicated.length;

  if (removedCount > 0) {
    logger.debug(`Deduplicated ${removedCount} images (${images.length} → ${deduplicated.length})`);
  }

  return deduplicated;
}

/**
 * Deduplicate videos based on URL, dimensions, and duration
 */
export function deduplicateVideos(videos: StockVideo[]): StockVideo[] {
  const seen = new Map<string, StockVideo>();

  for (const video of videos) {
    // Create unique key: source + id
    const key = `${video.source}:${video.id}`;

    if (!seen.has(key)) {
      seen.set(key, video);
    } else {
      // If duplicate, keep higher quality version
      const existing = seen.get(key)!;
      const existingQuality = existing.width * existing.height;
      const currentQuality = video.width * video.height;

      if (currentQuality > existingQuality || video.duration > existing.duration) {
        seen.set(key, video);
      }
    }
  }

  const deduplicated = Array.from(seen.values());
  const removedCount = videos.length - deduplicated.length;

  if (removedCount > 0) {
    logger.debug(`Deduplicated ${removedCount} videos (${videos.length} → ${deduplicated.length})`);
  }

  return deduplicated;
}

/**
 * Deduplicate mixed media (images and videos)
 */
export function deduplicateMedia(media: Array<StockImage | StockVideo>): Array<StockImage | StockVideo> {
  const images = media.filter(m => 'photographer' in m) as StockImage[];
  const videos = media.filter(m => 'fps' in m) as StockVideo[];

  const deduplicatedImages = deduplicateImages(images);
  const deduplicatedVideos = deduplicateVideos(videos);

  return [...deduplicatedImages, ...deduplicatedVideos];
}
