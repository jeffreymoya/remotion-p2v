/**
 * Image quality validator with SSRF protection
 */

import axios from 'axios';
import sharp from 'sharp';
import { logger } from '../../utils/logger';

/**
 * Pre-validation result from URL checks
 */
export interface PreValidationResult {
  valid: boolean;
  contentType?: string;
  contentLength?: number;
  error?: string;
}

/**
 * Post-download validation result
 */
export interface ValidationResult {
  valid: boolean;
  metadata?: ImageMetadata;
  error?: string;
  qualityScore?: number;
}

/**
 * Image metadata from sharp
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'tiff';
  sizeBytes: number;
  aspectRatio: number;
}

/**
 * Image quality requirements
 */
export interface ImageRequirements {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  allowedFormats?: string[];
  minSizeBytes?: number;
  maxSizeBytes?: number;
  targetAspectRatio?: number;
  aspectRatioTolerance?: number;
}

/**
 * Quality configuration
 */
export interface QualityConfig {
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
  allowedFormats: string[];
  minSizeBytes: number;
  maxSizeBytes: number;
  aspectRatios: {
    target: number;
    tolerance: number;
  };
}

export class ImageQualityValidator {
  private config: QualityConfig;
  private blockedIpRanges: RegExp[];
  private blockedTlds: string[];

  constructor(config: QualityConfig) {
    this.config = config;

    // Private IP ranges (SSRF protection)
    this.blockedIpRanges = [
      /^10\./,                    // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./,              // 192.168.0.0/16
      /^127\./,                   // 127.0.0.0/8 (loopback)
      /^169\.254\./,              // 169.254.0.0/16 (link-local)
      /^0\./,                     // 0.0.0.0/8
      /^::1$/,                    // IPv6 loopback
      /^fe80:/i,                  // IPv6 link-local
      /^fc00:/i,                  // IPv6 unique local
      /^fd00:/i,                  // IPv6 unique local
    ];

    this.blockedTlds = ['.local', '.internal', '.corp'];
  }

  /**
   * Validate URL safety (SSRF protection)
   * - Allowed schemes: https:// only
   * - Blocked IPs: private ranges (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x)
   * - Blocked TLDs: .local, .internal, .corp
   * - Max length: 2048 characters
   */
  validateUrlSafety(url: string): boolean {
    try {
      // Check length
      if (url.length > 2048) {
        logger.warn(`URL too long: ${url.length} chars`);
        return false;
      }

      // Parse URL
      const parsedUrl = new URL(url);

      // Only allow HTTPS
      if (parsedUrl.protocol !== 'https:') {
        logger.warn(`Invalid protocol: ${parsedUrl.protocol}, only https:// allowed`);
        return false;
      }

      // Check for blocked TLDs
      const hostname = parsedUrl.hostname.toLowerCase();
      for (const tld of this.blockedTlds) {
        if (hostname.endsWith(tld)) {
          logger.warn(`Blocked TLD detected: ${hostname}`);
          return false;
        }
      }

      // Check for private IP ranges
      // Extract IP if hostname is an IP address
      const ipMatch = hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/);
      if (ipMatch) {
        for (const pattern of this.blockedIpRanges) {
          if (pattern.test(hostname)) {
            logger.warn(`Blocked IP range detected: ${hostname}`);
            return false;
          }
        }
      }

      // Check IPv6
      if (hostname.includes(':')) {
        for (const pattern of this.blockedIpRanges) {
          if (pattern.test(hostname)) {
            logger.warn(`Blocked IPv6 range detected: ${hostname}`);
            return false;
          }
        }
      }

      return true;
    } catch (error: any) {
      logger.error(`URL validation error: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate image URL before download
   * 1. URL validation (scheme, domain, IP blacklist)
   * 2. HEAD request (Content-Type, Content-Length)
   * @throws Error if URL is unsafe (SSRF protection)
   */
  async preValidateImage(url: string): Promise<PreValidationResult> {
    // Step 1: URL safety validation
    if (!this.validateUrlSafety(url)) {
      return {
        valid: false,
        error: 'URL failed safety validation (SSRF protection)',
      };
    }

    // Step 2: HEAD request to check headers
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        maxRedirects: 3,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      const contentType = response.headers['content-type']?.toLowerCase();
      const contentLength = response.headers['content-length']
        ? parseInt(response.headers['content-length'], 10)
        : undefined;

      // Validate content type
      if (!contentType || !contentType.startsWith('image/')) {
        return {
          valid: false,
          contentType,
          error: `Invalid content type: ${contentType}`,
        };
      }

      // Validate content length if available
      if (contentLength !== undefined) {
        if (contentLength < this.config.minSizeBytes) {
          return {
            valid: false,
            contentType,
            contentLength,
            error: `Image too small: ${contentLength} bytes (min: ${this.config.minSizeBytes})`,
          };
        }

        if (this.config.maxSizeBytes && contentLength > this.config.maxSizeBytes) {
          return {
            valid: false,
            contentType,
            contentLength,
            error: `Image too large: ${contentLength} bytes (max: ${this.config.maxSizeBytes})`,
          };
        }
      }

      return {
        valid: true,
        contentType,
        contentLength,
      };
    } catch (error: any) {
      logger.error(`Pre-validation HEAD request failed for ${url}: ${error.message}`);
      return {
        valid: false,
        error: `HEAD request failed: ${error.message}`,
      };
    }
  }

  /**
   * Validate downloaded image file using sharp
   */
  async validateImage(
    imagePath: string,
    requirements: ImageRequirements
  ): Promise<ValidationResult> {
    try {
      // Load image metadata with sharp
      const image = sharp(imagePath);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height || !metadata.format || !metadata.size) {
        return {
          valid: false,
          error: 'Failed to extract image metadata',
        };
      }

      // Build ImageMetadata object
      const imageMetadata: ImageMetadata = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format as ImageMetadata['format'],
        sizeBytes: metadata.size,
        aspectRatio: metadata.width / metadata.height,
      };

      // Validate against requirements
      const meetsQuality = this.meetsQualityCriteria(imageMetadata, requirements);

      if (!meetsQuality) {
        return {
          valid: false,
          metadata: imageMetadata,
          error: 'Image does not meet quality criteria',
        };
      }

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(imageMetadata, requirements);

      return {
        valid: true,
        metadata: imageMetadata,
        qualityScore,
      };
    } catch (error: any) {
      logger.error(`Image validation failed for ${imagePath}: ${error.message}`);
      return {
        valid: false,
        error: `Image validation error: ${error.message}`,
      };
    }
  }

  /**
   * Check if image meets quality threshold
   */
  meetsQualityCriteria(
    metadata: ImageMetadata,
    requirements: ImageRequirements
  ): boolean {
    // Check width
    if (requirements.minWidth && metadata.width < requirements.minWidth) {
      logger.debug(`Image width ${metadata.width} below minimum ${requirements.minWidth}`);
      return false;
    }

    if (requirements.maxWidth && metadata.width > requirements.maxWidth) {
      logger.debug(`Image width ${metadata.width} above maximum ${requirements.maxWidth}`);
      return false;
    }

    // Check height
    if (requirements.minHeight && metadata.height < requirements.minHeight) {
      logger.debug(`Image height ${metadata.height} below minimum ${requirements.minHeight}`);
      return false;
    }

    if (requirements.maxHeight && metadata.height > requirements.maxHeight) {
      logger.debug(`Image height ${metadata.height} above maximum ${requirements.maxHeight}`);
      return false;
    }

    // Check format
    if (requirements.allowedFormats && requirements.allowedFormats.length > 0) {
      if (!requirements.allowedFormats.includes(metadata.format)) {
        logger.debug(`Image format ${metadata.format} not in allowed formats`);
        return false;
      }
    }

    // Check file size
    if (requirements.minSizeBytes && metadata.sizeBytes < requirements.minSizeBytes) {
      logger.debug(`Image size ${metadata.sizeBytes} below minimum ${requirements.minSizeBytes}`);
      return false;
    }

    if (requirements.maxSizeBytes && metadata.sizeBytes > requirements.maxSizeBytes) {
      logger.debug(`Image size ${metadata.sizeBytes} above maximum ${requirements.maxSizeBytes}`);
      return false;
    }

    // Check aspect ratio
    if (requirements.targetAspectRatio && requirements.aspectRatioTolerance) {
      const ratioDiff = Math.abs(metadata.aspectRatio - requirements.targetAspectRatio);
      if (ratioDiff > requirements.aspectRatioTolerance) {
        logger.debug(
          `Image aspect ratio ${metadata.aspectRatio.toFixed(2)} differs from target ${requirements.targetAspectRatio.toFixed(2)} by ${ratioDiff.toFixed(2)} (tolerance: ${requirements.aspectRatioTolerance})`
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate quality score (0-1) based on metadata and requirements
   */
  private calculateQualityScore(
    metadata: ImageMetadata,
    requirements: ImageRequirements
  ): number {
    let score = 0;
    let weights = 0;

    // Resolution score (0-1)
    if (requirements.minWidth && requirements.minHeight) {
      const actualPixels = metadata.width * metadata.height;
      const targetPixels = 1920 * 1080; // Full HD
      const minPixels = requirements.minWidth * requirements.minHeight;

      let resolutionScore: number;
      if (actualPixels >= targetPixels) {
        resolutionScore = 1.0; // At or above target
      } else if (actualPixels < minPixels) {
        resolutionScore = 0.3; // Below minimum
      } else {
        // Linear interpolation between min and target
        resolutionScore = 0.3 + (0.7 * ((actualPixels - minPixels) / (targetPixels - minPixels)));
      }

      score += resolutionScore * 0.4; // 40% weight
      weights += 0.4;
    }

    // Format score (0-1)
    const formatScores: Record<string, number> = {
      'avif': 1.15,
      'webp': 1.1,
      'png': 1.0,
      'jpeg': 0.95,
      'jpg': 0.95,
      'gif': 0.7,
      'tiff': 0.8,
    };

    const formatScore = Math.min(1.0, formatScores[metadata.format] || 0.8);
    score += formatScore * 0.2; // 20% weight
    weights += 0.2;

    // Aspect ratio score (0-1)
    if (requirements.targetAspectRatio && requirements.aspectRatioTolerance) {
      const ratioDiff = Math.abs(metadata.aspectRatio - requirements.targetAspectRatio);
      const aspectScore = Math.max(0, 1 - (ratioDiff / requirements.aspectRatioTolerance));
      score += aspectScore * 0.4; // 40% weight
      weights += 0.4;
    }

    // Normalize score
    return weights > 0 ? score / weights : 0;
  }
}
