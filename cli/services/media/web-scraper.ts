/**
 * Web Scraper Service - Main orchestrator for web scraping operations
 *
 * Workflow:
 * 1. Generate search queries using Gemini
 * 2. Search images via Google Custom Search API
 * 3. Pre-validate URLs (SSRF protection + HEAD requests)
 * 4. Download valid candidates in parallel (max 3 concurrent)
 * 5. Post-validate with Sharp
 * 6. Stop when 5 valid candidates found (max 10 attempts)
 * 7. Select best image using Gemini + quality scoring
 */

import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';
import { logger } from '../../utils/logger';
import {
  ScrapedImage,
  QualityConfig,
  SelectionCriteria,
  WebScraperError,
  ImageDownloadError,
  ImageValidationError,
  ImageSelectionSchema,
} from '../../lib/scraper-types';
import { GoogleSearchClient, GoogleImageResult, GoogleSearchError } from './google-search';
import { ImageQualityValidator, ValidationResult, ImageMetadata, ImageRequirements } from './image-validator';
import { generateSearchQueriesPrompt, selectBestImagePrompt } from '../../../config/prompts/web-scrape.prompt';
import { GeminiCLIProvider } from '../ai/gemini-cli';

/**
 * Options for image search
 */
export interface ImageSearchOptions {
  targetCount?: number; // Target number of valid candidates (default: 5)
  maxAttempts?: number; // Maximum URLs to try downloading (default: 10)
  timeout?: number; // Total timeout in milliseconds (default: 120000)
  quality?: Partial<QualityConfig>; // Quality requirements
}

/**
 * Candidate image with download information
 */
interface CandidateImage {
  id: string;
  url: string;
  sourceUrl: string;
  cachePath: string;
  metadata: ImageMetadata;
  qualityScore: number;
  technicalQualityScore: number;
  aspectRatioScore: number;
}

/**
 * Web Scraper Service
 * Orchestrates web-based image gathering using Gemini and Google Custom Search
 */
export class WebScraperService {
  private aiProvider: GeminiCLIProvider;
  private googleSearchClient: GoogleSearchClient;
  private validator: ImageQualityValidator;
  private config: QualityConfig;
  private cacheDir: string;
  private maxConcurrent: number;

  constructor(
    aiProvider: GeminiCLIProvider,
    googleSearchClient: GoogleSearchClient,
    validator: ImageQualityValidator,
    config: QualityConfig
  ) {
    this.aiProvider = aiProvider;
    this.googleSearchClient = googleSearchClient;
    this.validator = validator;
    this.config = config;
    this.cacheDir = 'cache/media-scrape';
    this.maxConcurrent = 3; // Max 3 concurrent downloads
  }

  /**
   * Search for images for a scene using web scraping
   *
   * @param sceneDescription - Scene description (1-500 chars)
   * @param tags - Search tags (1-10 tags, each 1-50 chars)
   * @param options - Search options
   * @returns Array of validated images (target: 5, max attempts: 10)
   * @throws WebScraperError if search fails after retries
   */
  async searchImagesForScene(
    sceneDescription: string,
    tags: string[],
    options: ImageSearchOptions = {}
  ): Promise<ScrapedImage[]> {
    // Validate inputs
    this.validateInputs(sceneDescription, tags);

    const targetCount = options.targetCount ?? 5;
    const maxAttempts = options.maxAttempts ?? 10;
    const timeout = options.timeout ?? 120000; // 120s total timeout

    logger.info(`[SCRAPER] Searching for ${targetCount} images for scene: "${sceneDescription.substring(0, 50)}..."`);

    const startTime = Date.now();

    try {
      // Step 1: Generate search queries using Gemini
      const queries = await this.generateSearchQueries(sceneDescription, tags, targetCount);
      logger.info(`[SCRAPER] Generated ${queries.length} search queries`);

      // Step 2: Search images via Google Custom Search API
      const allImageResults = await this.searchAllQueries(queries);
      logger.info(`[SCRAPER] Found ${allImageResults.length} total image URLs from Google`);

      if (allImageResults.length === 0) {
        throw new WebScraperError(
          'No image URLs returned from Google Custom Search',
          'google_search'
        );
      }

      // Step 3-6: Download and validate candidates
      const validCandidates = await this.downloadAndValidateCandidates(
        allImageResults,
        targetCount,
        maxAttempts,
        timeout - (Date.now() - startTime)
      );

      logger.info(`[SCRAPER] Successfully validated ${validCandidates.length} candidates`);

      // Check minimum threshold
      if (validCandidates.length < 3) {
        throw new WebScraperError(
          `Only found ${validCandidates.length} valid candidates, need at least 3`,
          'insufficient_candidates'
        );
      }

      // Convert to ScrapedImage format
      const scrapedImages: ScrapedImage[] = validCandidates.map((candidate) => ({
        id: candidate.id,
        url: candidate.url,
        sourceUrl: candidate.sourceUrl,
        width: candidate.metadata.width,
        height: candidate.metadata.height,
        format: candidate.metadata.format as 'jpeg' | 'png' | 'webp',
        sizeBytes: candidate.metadata.sizeBytes,
        tags,
        metadata: {
          aspectRatio: candidate.metadata.aspectRatio,
          orientation: candidate.metadata.width > candidate.metadata.height ? 'landscape' :
                      candidate.metadata.width < candidate.metadata.height ? 'portrait' : 'square',
          hasAlpha: false, // Will be determined by sharp
          downloadedAt: new Date().toISOString(),
        },
        downloadedPath: candidate.cachePath,
      }));

      const elapsed = Date.now() - startTime;
      logger.info(`[SCRAPER] Search completed in ${(elapsed / 1000).toFixed(1)}s`);

      return scrapedImages;
    } catch (error: any) {
      if (error instanceof WebScraperError) {
        throw error;
      }

      throw new WebScraperError(
        `Image search failed: ${error.message}`,
        'search_failed',
        error
      );
    }
  }

  /**
   * Select the best image from candidates using Gemini + quality scoring
   *
   * @param candidates - Array of candidate images
   * @param sceneDescription - Scene description for relevance matching
   * @param criteria - Selection criteria weights
   * @returns Selected best image
   */
  async selectBestImage(
    candidates: ScrapedImage[],
    sceneDescription: string,
    criteria: SelectionCriteria
  ): Promise<ScrapedImage> {
    if (candidates.length === 0) {
      throw new WebScraperError('No candidates provided for selection', 'selection_failed');
    }

    logger.info(`[SCRAPER] Selecting best image from ${candidates.length} candidates`);

    try {
      // Step 1: Calculate quality scores for all candidates
      const scoredCandidates = candidates.map((candidate) => {
        const technicalQuality = this.calculateTechnicalQualityScore(candidate);
        const aspectRatioMatch = this.calculateAspectRatioScore(candidate);

        return {
          candidate,
          technicalQuality,
          aspectRatioMatch,
        };
      });

      // Step 2: Sort by technical quality + aspect ratio (pre-selection)
      scoredCandidates.sort((a, b) => {
        const scoreA = a.technicalQuality * 0.6 + a.aspectRatioMatch * 0.4;
        const scoreB = b.technicalQuality * 0.6 + b.aspectRatioMatch * 0.4;
        return scoreB - scoreA;
      });

      // Step 3: Take top 5 for Gemini evaluation (or all if less than 5)
      const topCandidates = scoredCandidates.slice(0, Math.min(5, candidates.length));

      // Step 4: Call Gemini with top candidates
      const prompt = selectBestImagePrompt({
        sceneDescription,
        candidates: topCandidates.map((scored) => ({
          url: scored.candidate.url,
          metadata: {
            width: scored.candidate.width,
            height: scored.candidate.height,
            format: scored.candidate.format,
            size: scored.candidate.sizeBytes,
          },
        })) as any, // Type assertion needed due to PromptVariables constraint
        criteria: {
          minWidth: this.config.minWidth,
          minHeight: this.config.minHeight,
          aspectRatio: `${this.config.aspectRatios.target.toFixed(2)} (16:9)`,
        } as any, // Type assertion needed due to PromptVariables constraint
      });

      let selectionResult;
      try {
        const geminiResponse = await this.aiProvider.complete(prompt);
        const cleanedResponse = this.cleanJsonResponse(geminiResponse);
        selectionResult = ImageSelectionSchema.parse(JSON.parse(cleanedResponse));

        logger.info(`[SCRAPER] Gemini selected candidate ${selectionResult.selectedIndex}: ${selectionResult.reasoning}`);
      } catch (geminiError: any) {
        // Fallback: Use top-scored candidate
        logger.warn(`[SCRAPER] Gemini selection failed, using top-scored candidate: ${geminiError.message}`);

        // Calculate fallback total score
        const fallbackScored = topCandidates.map((scored, idx) => {
          const totalScore =
            criteria.technicalQuality * scored.technicalQuality +
            criteria.aspectRatioMatch * scored.aspectRatioMatch +
            criteria.sceneRelevance * 0.5 + // Default relevance
            criteria.aestheticAppeal * 0.5; // Default aesthetic

          return { idx, totalScore };
        });

        fallbackScored.sort((a, b) => b.totalScore - a.totalScore);
        const bestIdx = fallbackScored[0].idx;

        return topCandidates[bestIdx].candidate;
      }

      // Step 5: Calculate final weighted score
      const selectedIdx = selectionResult.selectedIndex;
      if (selectedIdx < 0 || selectedIdx >= topCandidates.length) {
        logger.warn(`[SCRAPER] Invalid selection index ${selectedIdx}, using first candidate`);
        return topCandidates[0].candidate;
      }

      const selected = topCandidates[selectedIdx];

      // Calculate total score with Gemini's scene relevance and aesthetic scores
      const totalScore =
        criteria.sceneRelevance * selectionResult.scores.sceneRelevance +
        criteria.technicalQuality * selected.technicalQuality +
        criteria.aestheticAppeal * selectionResult.scores.aestheticAppeal +
        criteria.aspectRatioMatch * selected.aspectRatioMatch;

      logger.info(
        `[SCRAPER] Final selection score: ${totalScore.toFixed(3)} ` +
          `(relevance: ${selectionResult.scores.sceneRelevance.toFixed(2)}, ` +
          `technical: ${selected.technicalQuality.toFixed(2)}, ` +
          `aesthetic: ${selectionResult.scores.aestheticAppeal.toFixed(2)}, ` +
          `aspect: ${selected.aspectRatioMatch.toFixed(2)})`
      );

      return selected.candidate;
    } catch (error: any) {
      throw new WebScraperError(
        `Image selection failed: ${error.message}`,
        'selection_failed',
        error
      );
    }
  }

  /**
   * Generate search queries using Gemini
   */
  private async generateSearchQueries(
    sceneDescription: string,
    tags: string[],
    imageCount: number
  ): Promise<string[]> {
    try {
      const prompt = generateSearchQueriesPrompt({
        sceneDescription,
        tags,
        imageCount,
      });

      const response = await this.aiProvider.complete(prompt);
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleanedResponse);

      if (!parsed.queries || !Array.isArray(parsed.queries)) {
        throw new Error('Invalid response format: missing queries array');
      }

      return parsed.queries.filter((q: any) => typeof q === 'string' && q.trim().length > 0);
    } catch (error: any) {
      throw new WebScraperError(
        `Failed to generate search queries: ${error.message}`,
        'query_generation',
        error
      );
    }
  }

  /**
   * Search all queries via Google Custom Search API
   */
  private async searchAllQueries(queries: string[]): Promise<GoogleImageResult[]> {
    const allResults: GoogleImageResult[] = [];

    for (const query of queries) {
      try {
        const results = await this.googleSearchClient.searchImages(query, 10);
        allResults.push(...results);
      } catch (error: any) {
        if (error instanceof GoogleSearchError) {
          // Log but continue with other queries
          logger.warn(`[SCRAPER] Google search failed for query "${query}": ${error.message}`);
          continue;
        }
        throw error;
      }
    }

    // Deduplicate by URL
    const uniqueResults = Array.from(
      new Map(allResults.map((result) => [result.url, result])).values()
    );

    return uniqueResults;
  }

  /**
   * Download and validate candidates with early termination
   */
  private async downloadAndValidateCandidates(
    imageResults: GoogleImageResult[],
    targetCount: number,
    maxAttempts: number,
    remainingTimeout: number
  ): Promise<CandidateImage[]> {
    const validCandidates: CandidateImage[] = [];
    const startTime = Date.now();

    // Limit attempts
    const urlsToTry = imageResults.slice(0, maxAttempts);

    // Process in batches of maxConcurrent
    for (let i = 0; i < urlsToTry.length; i += this.maxConcurrent) {
      // Check timeout
      if (Date.now() - startTime > remainingTimeout) {
        logger.warn(`[SCRAPER] Timeout reached, stopping with ${validCandidates.length} candidates`);
        break;
      }

      // Early termination when target reached
      if (validCandidates.length >= targetCount) {
        logger.info(`[SCRAPER] Reached target of ${targetCount} candidates, stopping early`);
        break;
      }

      const batch = urlsToTry.slice(i, i + this.maxConcurrent);

      // Download batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map((imageResult) => this.downloadAndValidateImage(imageResult))
      );

      // Collect successful candidates
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          validCandidates.push(result.value);
        }
      }

      logger.debug(
        `[SCRAPER] Progress: ${validCandidates.length}/${targetCount} valid, ` +
          `${i + batch.length}/${urlsToTry.length} attempted`
      );
    }

    return validCandidates;
  }

  /**
   * Download and validate a single image
   * Returns null if validation fails (allows continuing with other candidates)
   */
  private async downloadAndValidateImage(
    imageResult: GoogleImageResult
  ): Promise<CandidateImage | null> {
    const url = imageResult.url;

    try {
      // Step 1: Pre-validate URL (SSRF protection)
      if (!this.validator.validateUrlSafety(url)) {
        logger.debug(`[SCRAPER] URL failed safety validation: ${url}`);
        return null;
      }

      // Step 2: Pre-validate with HEAD request
      const preValidation = await this.validator.preValidateImage(url);
      if (!preValidation.valid) {
        logger.debug(`[SCRAPER] Pre-validation failed for ${url}: ${preValidation.error}`);
        return null;
      }

      // Step 3: Download image to cache
      const cachePath = await this.downloadImage(url, imageResult.contextUrl);

      // Step 4: Post-validate with Sharp
      const requirements: ImageRequirements = {
        minWidth: this.config.minWidth,
        minHeight: this.config.minHeight,
        maxWidth: this.config.maxWidth,
        maxHeight: this.config.maxHeight,
        allowedFormats: this.config.allowedFormats,
        minSizeBytes: this.config.minSizeBytes,
        maxSizeBytes: this.config.maxSizeBytes,
        targetAspectRatio: this.config.aspectRatios.target,
        aspectRatioTolerance: this.config.aspectRatios.tolerance,
      };

      const validation = await this.validator.validateImage(cachePath, requirements);

      if (!validation.valid || !validation.metadata) {
        logger.debug(`[SCRAPER] Post-validation failed for ${url}: ${validation.error}`);
        // Cleanup failed download
        await this.cleanupFile(cachePath);
        return null;
      }

      // Step 5: Calculate quality scores
      const technicalQuality = this.calculateTechnicalQualityScore({
        width: validation.metadata.width,
        height: validation.metadata.height,
        format: validation.metadata.format as 'jpeg' | 'png' | 'webp',
      } as ScrapedImage);

      const aspectRatioScore = this.calculateAspectRatioScore({
        width: validation.metadata.width,
        height: validation.metadata.height,
      } as ScrapedImage);

      const qualityScore = validation.qualityScore ?? 0;

      // Generate unique ID
      const id = crypto.createHash('md5').update(url).digest('hex');

      const candidate: CandidateImage = {
        id,
        url,
        sourceUrl: imageResult.contextUrl,
        cachePath,
        metadata: validation.metadata,
        qualityScore,
        technicalQualityScore: technicalQuality,
        aspectRatioScore,
      };

      logger.debug(
        `[SCRAPER] Validated: ${url.substring(0, 50)}... ` +
          `(${validation.metadata.width}x${validation.metadata.height}, ` +
          `quality: ${qualityScore.toFixed(2)})`
      );

      return candidate;
    } catch (error: any) {
      logger.debug(`[SCRAPER] Failed to download/validate ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Download image with streaming to avoid memory exhaustion
   */
  private async downloadImage(url: string, sourceUrl: string): Promise<string> {
    // Generate cache path
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const cachePath = path.join(this.cacheDir, `${hash}.tmp`);

    // Check if already cached
    if (await fs.pathExists(cachePath)) {
      logger.debug(`[SCRAPER] Cache hit: ${url.substring(0, 50)}...`);
      return cachePath;
    }

    try {
      // Ensure cache directory exists
      await fs.ensureDir(this.cacheDir);

      // Stream download to avoid buffering in memory
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 30000, // 30s per download
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RemotionP2V/1.0)',
          'Referer': sourceUrl,
        },
        maxRedirects: 3,
      });

      // Validate Content-Type
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        throw new ImageDownloadError(
          `Invalid content type: ${contentType}`,
          url
        );
      }

      // Write to temporary file
      const writer = fs.createWriteStream(cachePath);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', (err) => reject(err));
      });

      // Verify file was written
      const stats = await fs.stat(cachePath);
      if (stats.size === 0) {
        throw new ImageDownloadError('Downloaded file is empty', url);
      }

      // Verify with sharp (validates file signature)
      await sharp(cachePath).metadata();

      logger.debug(`[SCRAPER] Downloaded: ${url.substring(0, 50)}... (${stats.size} bytes)`);

      return cachePath;
    } catch (error: any) {
      // Cleanup partial download
      await this.cleanupFile(cachePath);

      throw new ImageDownloadError(
        `Download failed: ${error.message}`,
        url,
        error.response?.status,
        error
      );
    }
  }

  /**
   * Calculate technical quality score (0-1)
   * Based on resolution and format
   */
  private calculateTechnicalQualityScore(image: ScrapedImage): number {
    const actualPixels = image.width * image.height;
    const targetPixels = 1920 * 1080; // Full HD

    // Resolution score (capped at 1.0 for images exceeding target)
    let resolutionScore = Math.min(1.0, actualPixels / targetPixels);

    // Format multiplier
    const formatMultipliers: Record<string, number> = {
      'avif': 1.15,
      'webp': 1.1,
      'png': 1.0,
      'jpeg': 0.95,
      'jpg': 0.95,
    };

    const formatMultiplier = formatMultipliers[image.format] || 1.0;
    const technicalScore = resolutionScore * formatMultiplier;

    // Cap at 1.0
    return Math.min(1.0, technicalScore);
  }

  /**
   * Calculate aspect ratio match score (0-1)
   */
  private calculateAspectRatioScore(image: ScrapedImage): number {
    const actualRatio = image.width / image.height;
    const targetRatio = this.config.aspectRatios.target;
    const tolerance = this.config.aspectRatios.tolerance;

    const ratioDiff = Math.abs(targetRatio - actualRatio);
    const score = Math.max(0, 1 - ratioDiff / tolerance);

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Validate inputs
   */
  private validateInputs(sceneDescription: string, tags: string[]): void {
    if (!sceneDescription || sceneDescription.length === 0) {
      throw new WebScraperError('Scene description cannot be empty', 'validation');
    }

    if (sceneDescription.length > 500) {
      throw new WebScraperError(
        'Scene description too long (max 500 chars)',
        'validation'
      );
    }

    if (!tags || tags.length === 0) {
      throw new WebScraperError('Tags array cannot be empty', 'validation');
    }

    if (tags.length > 10) {
      throw new WebScraperError('Too many tags (max 10)', 'validation');
    }

    for (const tag of tags) {
      if (tag.length > 50) {
        throw new WebScraperError(`Tag too long: "${tag}" (max 50 chars)`, 'validation');
      }
    }
  }

  /**
   * Clean JSON response from Gemini (remove markdown blocks)
   */
  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks if present
    let cleaned = response.trim();

    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return cleaned.trim();
  }

  /**
   * Cleanup file (ignore errors)
   */
  private async cleanupFile(filePath: string): Promise<void> {
    try {
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}
