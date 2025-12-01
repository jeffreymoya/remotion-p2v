import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffprobe from 'ffprobe-static';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import sharp from 'sharp';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient, Image, Video, ImageTag, VideoTag } from '../../../src/generated/prisma/client';
import { logger } from '../../utils/logger';

ffmpeg.setFfprobePath(ffprobe.path);
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

const DEFAULT_LIBRARY_ROOT = path.resolve('/media/videos');
const THUMB_WIDTH = 400;
const DEFAULT_CANDIDATE_LIMIT = 120;
const DEFAULT_SEMANTIC_MIN_SCORE = 0.18;
const DEFAULT_SEMANTIC_CANDIDATE_LIMIT = 250;
const DEFAULT_EMBED_DIMENSIONS = 384;
const DEFAULT_LIBRARY_BUDGET_BYTES = (() => {
  if (process.env.LIBRARY_BUDGET_BYTES) {
    const parsed = Number(process.env.LIBRARY_BUDGET_BYTES);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.LIBRARY_BUDGET_GB) {
    const parsed = Number(process.env.LIBRARY_BUDGET_GB);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed * 1024 * 1024 * 1024;
  }
  // Default ~300 GB
  return 300 * 1024 * 1024 * 1024;
})();
const DEFAULT_THUMB_CONCURRENCY = 2;
const DEFAULT_OPTIMIZE_SAVINGS_PERCENT = 5;
const GC_BATCH_SIZE = 200;

type MediaKind = 'image' | 'video';

export interface LocalMediaRepoOptions {
  libraryRoot?: string;
  preferRecencyBoost?: number;
  candidateLimit?: number;
  prisma?: PrismaClient;
  budgetBytes?: number;
  asyncThumbs?: boolean;
  thumbConcurrency?: number;
  semanticEnabled?: boolean;
  semanticMinScore?: number;
  semanticCandidateLimit?: number;
  semanticDimensions?: number;
  optimizeImages?: boolean;
  optimizeMinSavingsPercent?: number;
}

export interface SearchOptions {
  minWidth?: number;
  minHeight?: number;
  minDurationMs?: number;
  desiredAspectRatio?: number;
  maxResults?: number;
  preferRecencyBoost?: number;
}

interface BaseRecord {
  id: string;
  sha256: string;
  originalSha256: string;
  filename: string;
  ext: string;
  path: string;
  thumbPath?: string | null;
  bytes: number;
  width: number;
  height: number;
  provider: string;
  sourceUrl?: string | null;
  embedding?: number[] | null;
  tags: string[];
  createdAt: Date;
  lastUsedAt: Date;
}

export interface LocalImageRecord extends BaseRecord {
  type: 'image';
}

export interface LocalVideoRecord extends BaseRecord {
  type: 'video';
  durationMs: number;
  fps?: number | null;
  videoCodec?: string | null;
  audioCodec?: string | null;
  bitrate?: number | null;
  hasAudio: boolean;
}

export type ScoredImage = LocalImageRecord & { score: number };
export type ScoredVideo = LocalVideoRecord & { score: number };

export interface DownloadedAsset {
  path: string;
  type?: MediaKind;
}

interface PreparedAsset {
  path: string;
  sha256: string;
  bytes: number;
  ext: string;
  cleanup?: () => Promise<void>;
}

export interface GarbageCollectResult {
  freedBytes: number;
  removed: number;
  remainingBytes: number;
  budgetBytes: number;
  skipped: number;
}

export class LocalMediaRepo {
  private prisma: PrismaClient;
  private ownsPrisma: boolean;
  private libraryRoot: string;
  private connected = false;
  private libraryPrepared = false;
  private preferRecencyBoost: number;
  private candidateLimit: number;
  private budgetBytes: number;
  private thumbQueueEnabled: boolean;
  private thumbConcurrency: number;
  private semanticEnabled: boolean;
  private semanticMinScore: number;
  private semanticCandidateLimit: number;
  private semanticDimensions: number;
  private optimizeImages: boolean;
  private optimizeMinSavingsPercent: number;
  private thumbQueue: Array<() => Promise<void>> = [];
  private thumbActive = 0;
  private gcInFlight = false;
  private gcRequested = false;
  private ownedPool?: Pool;

  constructor(options: LocalMediaRepoOptions = {}) {
    const resolvedLibraryRoot = options.libraryRoot || process.env.LIBRARY_ROOT || DEFAULT_LIBRARY_ROOT;
    this.libraryRoot = path.resolve(resolvedLibraryRoot);
    if (options.prisma) {
      this.prisma = options.prisma;
      this.ownsPrisma = false;
    } else {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL is required for the local media library');
      }
      this.ownedPool = new Pool({ connectionString });
      const adapter = new PrismaPg(this.ownedPool);
      this.prisma = new PrismaClient({ adapter });
      this.ownsPrisma = true;
    }
    this.preferRecencyBoost = options.preferRecencyBoost ?? 0.1;
    this.candidateLimit = options.candidateLimit ?? DEFAULT_CANDIDATE_LIMIT;
    this.budgetBytes = options.budgetBytes ?? DEFAULT_LIBRARY_BUDGET_BYTES;
    this.thumbQueueEnabled = options.asyncThumbs ?? process.env.LOCAL_LIBRARY_ASYNC_THUMBS === '1';
    this.thumbConcurrency = options.thumbConcurrency ?? DEFAULT_THUMB_CONCURRENCY;
    this.semanticEnabled = options.semanticEnabled ?? process.env.LOCAL_LIBRARY_SEMANTIC === '1';
    this.semanticMinScore = options.semanticMinScore ?? readEnvNumber('LOCAL_LIBRARY_SEMANTIC_MIN_SCORE', DEFAULT_SEMANTIC_MIN_SCORE);
    this.semanticCandidateLimit = options.semanticCandidateLimit ?? readEnvNumber(
      'LOCAL_LIBRARY_SEMANTIC_CANDIDATES',
      DEFAULT_SEMANTIC_CANDIDATE_LIMIT
    );
    this.semanticDimensions = options.semanticDimensions ?? readEnvNumber(
      'LOCAL_LIBRARY_SEMANTIC_DIMENSIONS',
      DEFAULT_EMBED_DIMENSIONS
    );
    this.optimizeImages = options.optimizeImages ?? process.env.LOCAL_LIBRARY_OPTIMIZE_IMAGES === '1';
    this.optimizeMinSavingsPercent = options.optimizeMinSavingsPercent
      ?? readEnvNumber('LOCAL_LIBRARY_OPTIMIZE_MIN_SAVINGS', DEFAULT_OPTIMIZE_SAVINGS_PERCENT);
  }

  /**
   * Public availability check used by gather to fail fast when the DB or library root
   * is unreachable. Simply delegates to the internal readiness guard.
   */
  async ensureAvailable(): Promise<void> {
    await this.ensureReady();
  }

  async dispose(): Promise<void> {
    if (this.ownsPrisma && this.connected) {
      await this.prisma.$disconnect();
    }
    if (this.ownedPool) {
      await this.ownedPool.end().catch(() => undefined);
      this.ownedPool = undefined;
    }
  }

  async ingestImage(filePath: string, tags: string[], provider: string, sourceUrl?: string): Promise<LocalImageRecord> {
    await this.ensureReady();

    const normalizedTags = normalizeTags(tags);
    if (normalizedTags.length === 0) {
      throw new Error('At least one tag is required to ingest an image');
    }

    const originalSha256 = await hashFile(filePath);
    const existing = await this.prisma.image.findFirst({
      where: {
        OR: [{ originalSha256 }, { sha256: originalSha256 }],
      },
      include: { tags: true },
    });

    const ext = getExtension(filePath);
    const stats = await fs.stat(filePath);

    if (existing) {
      await this.addMissingTags('image', existing.id, normalizedTags, existing.tags);
      let ensured = await this.ensureStoredFile(
        'image',
        existing,
        filePath,
        ext,
        existing.sha256,
        stats.size,
        originalSha256
      );
      if (this.semanticEnabled && (!ensured.embedding || ensured.embedding.length === 0)) {
        const embedding = buildEmbedding(normalizedTags, this.semanticDimensions);
        ensured = await this.prisma.image.update({
          where: { id: ensured.id },
          data: { embedding },
          include: { tags: true },
        }) as any;
      }
      return mapImageRecord(ensured, mergeTags(ensured.tags as ImageTag[], normalizedTags, 'image', existing.id));
    }

    const prepared = await this.prepareStoredAsset('image', filePath, ext);
    await this.ensureWithinBudget(prepared.bytes);

    const metadata = await sharp(prepared.path).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to read image dimensions');
    }
    validateImageExtension(prepared.ext, metadata.format);

    const destinationPath = this.getOriginalPath('image', prepared.sha256, prepared.ext);
    await this.copyAndVerify(prepared.path, destinationPath, prepared.sha256);

    const thumbPath = this.thumbQueueEnabled ? null : await this.generateImageThumb(destinationPath, prepared.sha256);
    const embedding = this.semanticEnabled
      ? buildEmbedding(normalizedTags, this.semanticDimensions)
      : [];

    const image = await this.prisma.image.create({
      data: {
        sha256: prepared.sha256,
        originalSha256,
        filename: path.basename(destinationPath),
        ext: prepared.ext,
        bytes: prepared.bytes,
        width: metadata.width,
        height: metadata.height,
        provider,
        sourceUrl,
        path: destinationPath,
        thumbPath,
        embedding,
        tags: { create: normalizedTags.map(tag => ({ tag })) },
      },
      include: { tags: true },
    });

    if (this.thumbQueueEnabled) {
      this.enqueueThumbJob(async () => {
        const generated = await this.generateImageThumb(destinationPath, prepared.sha256, image.id);
        if (generated) {
          await this.prisma.image.update({ where: { id: image.id }, data: { thumbPath: generated } });
        }
      });
    }

    if (prepared.cleanup) {
      await prepared.cleanup();
    }

    return mapImageRecord(image, image.tags);
  }

  async ingestVideo(filePath: string, tags: string[], provider: string, sourceUrl?: string): Promise<LocalVideoRecord> {
    await this.ensureReady();

    const normalizedTags = normalizeTags(tags);
    if (normalizedTags.length === 0) {
      throw new Error('At least one tag is required to ingest a video');
    }

    const originalSha256 = await hashFile(filePath);
    const existing = await this.prisma.video.findFirst({
      where: { OR: [{ originalSha256 }, { sha256: originalSha256 }] },
      include: { tags: true },
    });

    const ext = getExtension(filePath);
    const stats = await fs.stat(filePath);

    if (existing) {
      await this.addMissingTags('video', existing.id, normalizedTags, existing.tags);
      let ensured = await this.ensureStoredFile(
        'video',
        existing,
        filePath,
        ext,
        existing.sha256,
        stats.size,
        originalSha256
      );
      if (this.semanticEnabled && (!ensured.embedding || ensured.embedding.length === 0)) {
        const embedding = buildEmbedding(normalizedTags, this.semanticDimensions);
        ensured = await this.prisma.video.update({
          where: { id: ensured.id },
          data: { embedding },
          include: { tags: true },
        }) as any;
      }
      return mapVideoRecord(ensured, mergeTags(ensured.tags as VideoTag[], normalizedTags, 'video', existing.id));
    }

    const prepared = await this.prepareStoredAsset('video', filePath, ext);
    await this.ensureWithinBudget(prepared.bytes);

    const probe = await probeVideo(prepared.path);
    validateVideoExtension(prepared.ext, probe.format);

    const destinationPath = this.getOriginalPath('video', prepared.sha256, prepared.ext);
    await this.copyAndVerify(prepared.path, destinationPath, prepared.sha256);

    const thumbPath = this.thumbQueueEnabled
      ? null
      : await this.generateVideoThumb(destinationPath, prepared.sha256, probe.durationMs);
    const embedding = this.semanticEnabled
      ? buildEmbedding(normalizedTags, this.semanticDimensions)
      : [];

    const video = await this.prisma.video.create({
      data: {
        sha256: prepared.sha256,
        originalSha256,
        filename: path.basename(destinationPath),
        ext: prepared.ext,
        bytes: prepared.bytes,
        width: probe.width,
        height: probe.height,
        durationMs: probe.durationMs,
        fps: probe.fps,
        videoCodec: probe.videoCodec,
        audioCodec: probe.audioCodec,
        bitrate: probe.bitrate,
        hasAudio: probe.hasAudio,
        provider,
        sourceUrl,
        path: destinationPath,
        thumbPath,
        embedding,
        tags: { create: normalizedTags.map(tag => ({ tag })) },
      },
      include: { tags: true },
    });

    if (this.thumbQueueEnabled) {
      this.enqueueThumbJob(async () => {
        const generated = await this.generateVideoThumb(destinationPath, prepared.sha256, probe.durationMs, video.id);
        if (generated) {
          await this.prisma.video.update({ where: { id: video.id }, data: { thumbPath: generated } });
        }
      });
    }

    if (prepared.cleanup) {
      await prepared.cleanup();
    }

    return mapVideoRecord(video, video.tags);
  }

  async ingestDownloaded(asset: DownloadedAsset, tags: string[], provider: string, sourceUrl?: string): Promise<LocalImageRecord | LocalVideoRecord> {
    const kind = asset.type || inferMediaKind(asset.path);
    if (kind === 'image') {
      return this.ingestImage(asset.path, tags, provider, sourceUrl);
    }
    return this.ingestVideo(asset.path, tags, provider, sourceUrl);
  }

  async searchImages(tags: string[], opts: SearchOptions = {}): Promise<ScoredImage[]> {
    await this.ensureReady();
    const normalizedTags = normalizeTags(tags);
    if (normalizedTags.length === 0) return [];

    const candidates = await this.prisma.image.findMany({
      where: {
        width: opts.minWidth ? { gte: opts.minWidth } : undefined,
        height: opts.minHeight ? { gte: opts.minHeight } : undefined,
        tags: { some: { tag: { in: normalizedTags } } },
      },
      include: { tags: true },
      take: this.getCandidateLimit(opts.maxResults),
      orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const results: ScoredImage[] = [];
    const desiredAspect = opts.desiredAspectRatio;
    const recencyBoost = opts.preferRecencyBoost ?? this.preferRecencyBoost;

    for (const image of candidates) {
      const tagSet = new Set(image.tags.map(t => t.tag));
      const overlap = normalizedTags.filter(tag => tagSet.has(tag));
      if (overlap.length === 0) continue;

      const score = computeScore({
        overlapCount: overlap.length,
        assetTags: tagSet,
        queryTags: normalizedTags,
        lastUsedAt: image.lastUsedAt,
        recencyBoost,
        aspectRatio: image.width / image.height,
        desiredAspect,
      });

      results.push({
        ...mapImageRecord(image, image.tags),
        score,
      });
    }

    let combined: ScoredImage[] = results;
    const max = opts.maxResults ?? 20;

    if (this.semanticEnabled && combined.length < max) {
      const exclude = new Set(combined.map(r => r.id));
      const semantic = await this.semanticSearch('image', normalizedTags, opts, exclude) as ScoredImage[];
      combined = mergeAndDedupe(combined, semantic);
    }

    combined.sort((a, b) => sortByScore(a, b));
    return combined.slice(0, max);
  }

  async searchVideos(tags: string[], opts: SearchOptions = {}): Promise<ScoredVideo[]> {
    await this.ensureReady();
    const normalizedTags = normalizeTags(tags);
    if (normalizedTags.length === 0) return [];

    const candidates = await this.prisma.video.findMany({
      where: {
        width: opts.minWidth ? { gte: opts.minWidth } : undefined,
        height: opts.minHeight ? { gte: opts.minHeight } : undefined,
        durationMs: opts.minDurationMs ? { gte: opts.minDurationMs } : undefined,
        tags: { some: { tag: { in: normalizedTags } } },
      },
      include: { tags: true },
      take: this.getCandidateLimit(opts.maxResults),
      orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const results: ScoredVideo[] = [];
    const desiredAspect = opts.desiredAspectRatio;
    const recencyBoost = opts.preferRecencyBoost ?? this.preferRecencyBoost;

    for (const video of candidates) {
      const tagSet = new Set(video.tags.map(t => t.tag));
      const overlap = normalizedTags.filter(tag => tagSet.has(tag));
      if (overlap.length === 0) continue;

      const score = computeScore({
        overlapCount: overlap.length,
        assetTags: tagSet,
        queryTags: normalizedTags,
        lastUsedAt: video.lastUsedAt,
        recencyBoost,
        aspectRatio: video.width / video.height,
        desiredAspect,
      });

      results.push({
        ...mapVideoRecord(video, video.tags),
        score,
      });
    }

    let combined: ScoredVideo[] = results;
    const max = opts.maxResults ?? 20;

    if (this.semanticEnabled && combined.length < max) {
      const exclude = new Set(combined.map(r => r.id));
      const semantic = await this.semanticSearch('video', normalizedTags, opts, exclude) as ScoredVideo[];
      combined = mergeAndDedupe(combined, semantic);
    }

    combined.sort((a, b) => sortByScore(a, b));
    return combined.slice(0, max);
  }

  private async semanticSearch(
    kind: MediaKind,
    normalizedTags: string[],
    opts: SearchOptions,
    excludeIds: Set<string>
  ): Promise<Array<ScoredImage | ScoredVideo>> {
    if (!this.semanticEnabled || normalizedTags.length === 0) return [];

    const queryEmbedding = buildEmbedding(normalizedTags, this.semanticDimensions);
    if (queryEmbedding.length === 0) return [];

    const where: any = {
      id: excludeIds.size ? { notIn: Array.from(excludeIds) } : undefined,
    };

    if (opts.minWidth) where.width = { gte: opts.minWidth };
    if (opts.minHeight) where.height = { gte: opts.minHeight };
    if (opts.minDurationMs && kind === 'video') where.durationMs = { gte: opts.minDurationMs };

    const take = Math.max(this.semanticCandidateLimit, this.getCandidateLimit(opts.maxResults));
    const orderBy = [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }];
    const candidates =
      kind === 'image'
        ? await this.prisma.image.findMany({ where, include: { tags: true }, take, orderBy })
        : await this.prisma.video.findMany({ where, include: { tags: true }, take, orderBy });

    const recencyBoost = opts.preferRecencyBoost ?? this.preferRecencyBoost;
    const desiredAspect = opts.desiredAspectRatio;

    const results: Array<ScoredImage | ScoredVideo> = [];

    for (const candidate of candidates) {
      const vector = (candidate as any).embedding as number[] | undefined;
      if (!vector || vector.length === 0) continue;

      const similarity = cosineSimilarity(queryEmbedding, vector);
      if (!Number.isFinite(similarity) || similarity < this.semanticMinScore) continue;

      const aspectRatio =
        (candidate as any).width && (candidate as any).height
          ? (candidate as any).width / (candidate as any).height
          : undefined;

      const score = computeSemanticScore({
        similarity,
        lastUsedAt: (candidate as any).lastUsedAt,
        recencyBoost,
        aspectRatio,
        desiredAspect,
      });

      if (kind === 'image') {
        results.push({
          ...(mapImageRecord(candidate as Image, (candidate as any).tags)),
          score,
        } as ScoredImage);
      } else {
        results.push({
          ...(mapVideoRecord(candidate as Video, (candidate as any).tags)),
          score,
        } as ScoredVideo);
      }
    }

    results.sort((a, b) => sortByScore(a as any, b as any));
    return results.slice(0, opts.maxResults ?? this.semanticCandidateLimit);
  }

  async markUsed(ids: string[], type: MediaKind): Promise<void> {
    await this.ensureReady();
    const now = new Date();
    if (type === 'image') {
      await this.prisma.image.updateMany({ where: { id: { in: ids } }, data: { lastUsedAt: now } });
    } else {
      await this.prisma.video.updateMany({ where: { id: { in: ids } }, data: { lastUsedAt: now } });
    }
  }

  /**
   * Garbage collect to respect the configured budget (default 300 GB).
   * Evicts global LRU across images + videos, skipping items referenced by
   * current project manifests and any protected ids passed in opts.
   */
  async garbageCollect(opts: { targetBytes?: number; dryRun?: boolean; protectedIds?: Set<string> } = {}): Promise<GarbageCollectResult> {
    await this.ensureReady();

    const budget = opts.targetBytes ?? this.budgetBytes;
    const usage = await this.getUsage();
    const protectedIds = opts.protectedIds ?? (await collectProtectedLibraryIds());
    let bytesOver = usage.totalBytes - budget;
    if (bytesOver <= 0) {
      return {
        freedBytes: 0,
        removed: 0,
        remainingBytes: usage.totalBytes,
        budgetBytes: budget,
        skipped: protectedIds.size,
      };
    }

    let freedBytes = 0;
    let removed = 0;
    let skipped = 0;
    let oldestImages: Array<Pick<Image, 'id' | 'bytes' | 'path' | 'thumbPath' | 'lastUsedAt'>> = [];
    let oldestVideos: Array<Pick<Video, 'id' | 'bytes' | 'path' | 'thumbPath' | 'lastUsedAt'>> = [];

    const protectedList = Array.from(protectedIds);

    const loadCandidates = async () => {
      const [images, videos] = await Promise.all([
        this.prisma.image.findMany({
          where: { id: { notIn: protectedList } },
          select: { id: true, bytes: true, path: true, thumbPath: true, lastUsedAt: true },
          orderBy: [{ lastUsedAt: 'asc' }, { createdAt: 'asc' }],
          take: GC_BATCH_SIZE,
        }),
        this.prisma.video.findMany({
          where: { id: { notIn: protectedList } },
          select: { id: true, bytes: true, path: true, thumbPath: true, lastUsedAt: true },
          orderBy: [{ lastUsedAt: 'asc' }, { createdAt: 'asc' }],
          take: GC_BATCH_SIZE,
        }),
      ]);
      oldestImages = images.filter(img => !protectedIds.has(img.id));
      oldestVideos = videos.filter(v => !protectedIds.has(v.id));
    };

    await loadCandidates();

    const popNext = () => {
      if (oldestImages.length === 0 && oldestVideos.length === 0) return null;
      if (oldestImages.length === 0) return { kind: 'video' as const, node: oldestVideos.shift()! };
      if (oldestVideos.length === 0) return { kind: 'image' as const, node: oldestImages.shift()! };
      const img = oldestImages[0];
      const vid = oldestVideos[0];
      if (img.lastUsedAt <= vid.lastUsedAt) {
        oldestImages.shift();
        return { kind: 'image' as const, node: img };
      }
      oldestVideos.shift();
      return { kind: 'video' as const, node: vid };
    };

    while (bytesOver > 0) {
      if (oldestImages.length === 0 && oldestVideos.length === 0) {
        await loadCandidates();
        if (oldestImages.length === 0 && oldestVideos.length === 0) {
          break;
        }
      }

      const next = popNext();
      if (!next) break;
      const { kind, node } = next;
      if (!node) break;

      if (protectedIds.has(node.id)) {
        skipped++;
        continue;
      }

      if (!opts.dryRun) {
        if (node.path) await fs.remove(node.path).catch(() => undefined);
        if (node.thumbPath) await fs.remove(node.thumbPath).catch(() => undefined);
        if (kind === 'image') {
          await this.prisma.image.delete({ where: { id: node.id } });
        } else {
          await this.prisma.video.delete({ where: { id: node.id } });
        }
      }

      freedBytes += node.bytes;
      removed += 1;
      bytesOver -= node.bytes;
    }

    const remainingUsage = opts.dryRun
      ? Math.max(0, usage.totalBytes - freedBytes)
      : (await this.getUsage()).totalBytes;

    return {
      freedBytes,
      removed,
      remainingBytes: remainingUsage,
      budgetBytes: budget,
      skipped,
    };
  }

  private async ensureReady(): Promise<void> {
    if (!this.connected) {
      await this.prisma.$connect();
      this.connected = true;
    }
    if (!this.libraryPrepared) {
      await this.ensureLibraryLayout();
      this.libraryPrepared = true;
    }
  }

  private async ensureLibraryLayout(): Promise<void> {
    const required = [
      this.libraryRoot,
      path.join(this.libraryRoot, 'images', 'original'),
      path.join(this.libraryRoot, 'images', 'thumbs'),
      path.join(this.libraryRoot, 'videos', 'original'),
      path.join(this.libraryRoot, 'videos', 'thumbs'),
    ];

    for (const dir of required) {
      await fs.ensureDir(dir);
    }

    await fs.access(this.libraryRoot, fs.constants.W_OK);
  }

  private async prepareStoredAsset(kind: MediaKind, sourcePath: string, ext: string): Promise<PreparedAsset> {
    if (kind === 'image' && this.optimizeImages) {
      const optimized = await maybeOptimizeImage(sourcePath, ext, this.optimizeMinSavingsPercent).catch(err => {
        logger.warn(`Image optimization skipped (${ext}): ${err.message}`);
        return null;
      });
      if (optimized) {
        return optimized;
      }
    }

    const stats = await fs.stat(sourcePath);
    const sha256 = await hashFile(sourcePath);
    return {
      path: sourcePath,
      sha256,
      bytes: stats.size,
      ext,
    };
  }

  private getOriginalPath(kind: MediaKind, sha256: string, ext: string): string {
    const prefix = sha256.slice(0, 2);
    const folder = path.join(this.libraryRoot, kind === 'image' ? 'images' : 'videos', 'original', prefix);
    return path.join(folder, `${sha256}.${ext}`);
  }

  private getThumbPath(kind: MediaKind, sha256: string): string {
    const folder = path.join(this.libraryRoot, kind === 'image' ? 'images' : 'videos', 'thumbs');
    return path.join(folder, `${sha256}.jpg`);
  }

  private async copyAndVerify(source: string, destination: string, sha256: string): Promise<void> {
    await fs.ensureDir(path.dirname(destination));
    await fs.copy(source, destination);

    const copiedHash = await hashFile(destination);
    if (copiedHash !== sha256) {
      await fs.remove(destination);
      throw new Error('Checksum verification failed after copy');
    }
  }

  private async ensureStoredFile(
    kind: MediaKind,
    record: Image & { tags: ImageTag[] } | Video & { tags: VideoTag[] },
    sourcePath: string,
    ext: string,
    sha256: string,
    bytes: number,
    originalSha256?: string
  ): Promise<(Image | Video) & { tags: Array<ImageTag | VideoTag> }> {
    const originalPath = record.path;
    const exists = await fs.pathExists(originalPath);
    let current: (Image | Video) & { tags: Array<ImageTag | VideoTag> } = record as any;
    let thumbPath: string | null | undefined = (record as any).thumbPath;

    if (!exists) {
      const prepared = await this.prepareStoredAsset(kind, sourcePath, ext);
      await this.ensureWithinBudget(prepared.bytes);

      const destination = this.getOriginalPath(kind, prepared.sha256, prepared.ext);
      await this.copyAndVerify(prepared.path, destination, prepared.sha256);

      const data: any = {
        path: destination,
        filename: path.basename(destination),
        ext: prepared.ext,
        bytes: prepared.bytes,
        sha256: prepared.sha256,
        originalSha256: originalSha256 || (record as any).originalSha256 || sha256,
      };

      current = kind === 'image'
        ? await this.prisma.image.update({ where: { id: record.id }, data, include: { tags: true } })
        : await this.prisma.video.update({ where: { id: record.id }, data, include: { tags: true } });

      thumbPath = current.thumbPath;

      if (prepared.cleanup) {
        await prepared.cleanup();
      }
    }

    const thumbMissing = !thumbPath || !(await fs.pathExists(thumbPath));

    if (thumbMissing) {
      thumbPath = kind === 'image'
        ? await this.generateImageThumb(current.path, current.sha256, current.id)
        : await this.generateVideoThumb(current.path, current.sha256, 'durationMs' in current ? current.durationMs : 0, current.id);
    }

    const needsUpdate = thumbMissing || (!current.originalSha256 && originalSha256);
    if (needsUpdate) {
      const data: any = {
        thumbPath,
        originalSha256: originalSha256 || (current as any).originalSha256 || sha256,
      };

      current = kind === 'image'
        ? await this.prisma.image.update({ where: { id: record.id }, data, include: { tags: true } })
        : await this.prisma.video.update({ where: { id: record.id }, data, include: { tags: true } });
    }

    return current as any;
  }

  private async generateImageThumb(originalPath: string, sha256: string, recordId?: string): Promise<string | null> {
    const thumbPath = this.getThumbPath('image', sha256);
    if (this.thumbQueueEnabled && recordId) {
      this.enqueueThumbJob(async () => {
        const generated = await this.generateImageThumb(originalPath, sha256);
        if (generated) {
          await this.prisma.image.update({ where: { id: recordId }, data: { thumbPath: generated } });
        }
      });
      return null;
    }

    try {
      await sharp(originalPath)
        .resize({ width: THUMB_WIDTH, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);
      return thumbPath;
    } catch (error: any) {
      logger.warn(`Failed to generate image thumbnail: ${error.message}`);
      return null;
    }
  }

  private async generateVideoThumb(originalPath: string, sha256: string, durationMs: number, recordId?: string): Promise<string | null> {
    const thumbPath = this.getThumbPath('video', sha256);
    if (this.thumbQueueEnabled && recordId) {
      this.enqueueThumbJob(async () => {
        const generated = await this.generateVideoThumb(originalPath, sha256, durationMs);
        if (generated) {
          await this.prisma.video.update({ where: { id: recordId }, data: { thumbPath: generated } });
        }
      });
      return null;
    }

    const attempts = [captureTimestamp(durationMs)];
    if (!attempts.includes(durationMs / 2000)) {
      attempts.push(durationMs / 2000);
    }

    for (const ts of attempts) {
      try {
        await extractPosterWithFluent(originalPath, thumbPath, ts);
        await normalizeThumbSize(thumbPath);
        return thumbPath;
      } catch (error: any) {
        logger.warn(`Poster extraction failed at ${ts}s: ${error.message}`);
      }

      try {
        await extractPosterWithSpawn(originalPath, thumbPath, ts);
        await normalizeThumbSize(thumbPath);
        return thumbPath;
      } catch (spawnError: any) {
        logger.warn(`Poster extraction (spawn) failed at ${ts}s: ${spawnError.message}`);
      }
    }

    return null;
  }

  private enqueueThumbJob(job: () => Promise<void>): void {
    this.thumbQueue.push(job);
    void this.drainThumbQueue();
  }

  private async drainThumbQueue(): Promise<void> {
    if (!this.thumbQueueEnabled) return;
    if (this.thumbActive >= this.thumbConcurrency) return;

    const next = this.thumbQueue.shift();
    if (!next) return;

    this.thumbActive += 1;
    try {
      await next();
    } catch (err: any) {
      logger.warn(`Thumbnail job failed: ${err.message}`);
    } finally {
      this.thumbActive -= 1;
      if (this.thumbQueue.length > 0) {
        void this.drainThumbQueue();
      }
    }
  }

  private async addMissingTags(
    kind: MediaKind,
    id: string,
    normalizedTags: string[],
    existingTags: Array<ImageTag | VideoTag>
  ): Promise<void> {
    const existingSet = new Set(existingTags.map(t => t.tag));
    const missing = normalizedTags.filter(tag => !existingSet.has(tag));
    if (missing.length === 0) return;

    if (kind === 'image') {
      await this.prisma.imageTag.createMany({
        data: missing.map(tag => ({ imageId: id, tag })),
        skipDuplicates: true,
      });
    } else {
      await this.prisma.videoTag.createMany({
        data: missing.map(tag => ({ videoId: id, tag })),
        skipDuplicates: true,
      });
    }
  }

  private getCandidateLimit(requestedMax?: number): number {
    const desired = requestedMax ? Math.max(requestedMax * 4, this.candidateLimit) : this.candidateLimit;
    return Math.max(desired, 20);
  }

  private async ensureWithinBudget(additionalBytes: number): Promise<void> {
    if (additionalBytes <= 0) return;
    const usage = await this.getUsage();
    const projected = usage.totalBytes + additionalBytes;
    if (projected > this.budgetBytes) {
      this.scheduleGc();
      throw new Error(
        `Library quota exceeded: projected ${formatBytes(projected)} > budget ${formatBytes(this.budgetBytes)}. ` +
        `Triggered background GC; retry after cleanup.`
      );
    }
  }

  private async getUsage(): Promise<{ images: number; videos: number; totalBytes: number }> {
    const [imageAgg, videoAgg] = await Promise.all([
      aggregateBytes(this.prisma, 'image'),
      aggregateBytes(this.prisma, 'video'),
    ]);
    const totalBytes = (imageAgg.bytes ?? 0) + (videoAgg.bytes ?? 0);
    return {
      images: imageAgg.count ?? 0,
      videos: videoAgg.count ?? 0,
      totalBytes,
    };
  }

  private scheduleGc(): void {
    if (this.gcInFlight || this.gcRequested) return;
    this.gcRequested = true;
    setTimeout(() => {
      void this.garbageCollect().catch(err => logger.warn(`Background GC failed: ${err.message}`)).finally(() => {
        this.gcInFlight = false;
        this.gcRequested = false;
      });
      this.gcInFlight = true;
    }, 0);
  }
}

function normalizeTags(tags: string[]): string[] {
  const set = new Set<string>();
  for (const raw of tags) {
    const cleaned = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .map(part => part.trim())
      .filter(Boolean);

    for (const part of cleaned) {
      set.add(part);
    }
  }
  return Array.from(set);
}

function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function hashBuffer(buffer: Buffer): string {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

async function maybeOptimizeImage(
  sourcePath: string,
  ext: string,
  minSavingsPercent: number
): Promise<PreparedAsset | null> {
  const normalizedExt = ext.toLowerCase();
  const losslessFormats = ['png', 'webp', 'tif', 'tiff'];
  if (!losslessFormats.includes(normalizedExt)) return null;

  const input = await fs.readFile(sourcePath);
  let pipeline = sharp(input);

  if (normalizedExt === 'png') {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true, palette: true });
  } else if (normalizedExt === 'webp') {
    pipeline = pipeline.webp({ lossless: true });
  } else {
    pipeline = pipeline.tiff({ compression: 'lzw' });
  }

  const optimized = await pipeline.toBuffer();
  const savings = input.length === 0 ? 0 : 1 - optimized.length / input.length;
  if (savings * 100 < minSavingsPercent) return null;

  const tmpPath = path.join(os.tmpdir(), `library-opt-${crypto.randomUUID()}.${normalizedExt}`);
  await fs.writeFile(tmpPath, optimized);

  return {
    path: tmpPath,
    sha256: hashBuffer(optimized),
    bytes: optimized.length,
    ext: normalizedExt,
    cleanup: async () => {
      await fs.remove(tmpPath).catch(() => undefined);
    },
  };
}

function getExtension(filePath: string): string {
  return path.extname(filePath).replace('.', '').toLowerCase();
}

function validateImageExtension(ext: string, format?: string | null): void {
  if (!format) return;
  const allowed: Record<string, string[]> = {
    jpeg: ['jpg', 'jpeg'],
    png: ['png'],
    webp: ['webp'],
    gif: ['gif'],
    tiff: ['tif', 'tiff'],
  };

  const expected = allowed[format];
  if (expected && !expected.includes(ext)) {
    throw new Error(`Image extension .${ext} does not match detected format ${format}`);
  }
}

function validateVideoExtension(ext: string, format?: string | null): void {
  if (!format) return;
  const normalizedFormat = format.split(',').map(f => f.trim());
  const map: Record<string, string[]> = {
    mp4: ['mp4', 'mov', 'm4v', '3gp'],
    mov: ['mov'],
    mkv: ['matroska', 'mkv'],
    webm: ['webm'],
    avi: ['avi'],
  };

  const expectedFormats = map[ext];
  if (expectedFormats && !expectedFormats.some(fmt => normalizedFormat.includes(fmt))) {
    throw new Error(`Video extension .${ext} does not match detected container ${format}`);
  }
}

interface ProbeResult {
  durationMs: number;
  width: number;
  height: number;
  fps?: number | null;
  videoCodec?: string | null;
  audioCodec?: string | null;
  bitrate?: number | null;
  hasAudio: boolean;
  format?: string | null;
}

function probeVideo(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);

      const videoStream = data.streams.find(stream => stream.codec_type === 'video');
      const audioStream = data.streams.find(stream => stream.codec_type === 'audio');

      if (!videoStream || !videoStream.width || !videoStream.height) {
        return reject(new Error('Unable to read video dimensions'));
      }

      const durationSec = data.format?.duration ? Number(data.format.duration) : Number(videoStream.duration || 0);
      const fps = videoStream.r_frame_rate && videoStream.r_frame_rate.includes('/')
        ? parseFrameRate(videoStream.r_frame_rate)
        : undefined;

      resolve({
        durationMs: Math.round(durationSec * 1000),
        width: videoStream.width,
        height: videoStream.height,
        fps,
        videoCodec: videoStream.codec_name,
        audioCodec: audioStream?.codec_name ?? null,
        bitrate: data.format?.bit_rate ? Number(data.format.bit_rate) : undefined,
        hasAudio: Boolean(audioStream),
        format: data.format?.format_name || null,
      });
    });
  });
}

function parseFrameRate(rate: string): number | null {
  const [num, den] = rate.split('/').map(Number);
  if (!num || !den) return null;
  return Number((num / den).toFixed(2));
}

function captureTimestamp(durationMs: number): number {
  const durationSec = durationMs / 1000;
  if (durationSec <= 1) return Math.max(durationSec / 2, 0);
  return 1;
}

async function extractPosterWithFluent(originalPath: string, thumbPath: string, timestamp: number): Promise<void> {
  await fs.ensureDir(path.dirname(thumbPath));
  await new Promise<void>((resolve, reject) => {
    ffmpeg(originalPath)
      .on('end', resolve)
      .on('error', reject)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(thumbPath),
        folder: path.dirname(thumbPath),
        size: `${THUMB_WIDTH}x?`,
      });
  });
}

async function extractPosterWithSpawn(originalPath: string, thumbPath: string, timestamp: number): Promise<void> {
  const tmpOutput = `${thumbPath}.tmp.jpg`;
  await fs.ensureDir(path.dirname(tmpOutput));
  const args = [
    '-y',
    '-ss',
    timestamp.toFixed(2),
    '-i',
    originalPath,
    '-vframes',
    '1',
    '-vf',
    `scale=${THUMB_WIDTH}:-1:flags=lanczos`,
    tmpOutput,
  ];

  await new Promise<void>((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: 'ignore' });
    proc.on('error', reject);
    proc.on('exit', code => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });

  await fs.move(tmpOutput, thumbPath, { overwrite: true });
}

async function normalizeThumbSize(targetPath: string): Promise<void> {
  const output = await sharp(targetPath)
    .resize({ width: THUMB_WIDTH, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .jpeg({ quality: 80 })
    .toBuffer();

  await fs.writeFile(targetPath, output);
}

function inferMediaKind(filePath: string): MediaKind {
  const ext = getExtension(filePath);
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tif', 'tiff'];
  const videoExts = ['mp4', 'mov', 'm4v', 'mkv', 'webm', 'avi', 'mpg', 'mpeg'];
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  throw new Error(`Cannot infer media type for extension .${ext}`);
}

interface ScoreInput {
  overlapCount: number;
  assetTags: Set<string>;
  queryTags: string[];
  lastUsedAt?: Date;
  recencyBoost: number;
  aspectRatio?: number;
  desiredAspect?: number;
}

function computeScore(input: ScoreInput): number {
  const { overlapCount, assetTags, queryTags, lastUsedAt, recencyBoost, aspectRatio, desiredAspect } = input;
  const unionSize = new Set([...assetTags, ...queryTags]).size || 1;
  const coverage = overlapCount / Math.max(queryTags.length, 1);
  const tagScore = overlapCount + coverage * 0.6 + (overlapCount / unionSize) * 0.4;

  const recencyScore = computeRecencyComponent(lastUsedAt, recencyBoost);

  let aspectBonus = 0;
  if (aspectRatio && desiredAspect) {
    const delta = Math.abs(aspectRatio - desiredAspect) / desiredAspect;
    aspectBonus = Math.max(0, 0.5 - delta);
  }

  return tagScore + recencyScore + aspectBonus;
}

interface SemanticScoreInput {
  similarity: number;
  lastUsedAt?: Date;
  recencyBoost: number;
  aspectRatio?: number;
  desiredAspect?: number;
}

function computeSemanticScore(input: SemanticScoreInput): number {
  const { similarity, lastUsedAt, recencyBoost, aspectRatio, desiredAspect } = input;
  const recencyScore = computeRecencyComponent(lastUsedAt, recencyBoost);

  let aspectBonus = 0;
  if (aspectRatio && desiredAspect) {
    const delta = Math.abs(aspectRatio - desiredAspect) / desiredAspect;
    aspectBonus = Math.max(0, 0.4 - delta);
  }

  return similarity * 3 + recencyScore + aspectBonus;
}

function computeRecencyComponent(lastUsedAt: Date | undefined, recencyBoost: number): number {
  if (!lastUsedAt) return 0;
  const days = (Date.now() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
  const decay = 1 / (1 + Math.exp((days - 14) / 4)); // smoother falloff across ~2 weeks
  return recencyBoost * (0.25 + decay * 0.75);
}

function sortByScore<A extends { score: number; width: number; height: number; lastUsedAt: Date; id: string }>(a: A, b: A): number {
  if (b.score !== a.score) return b.score - a.score;
  const resA = a.width * a.height;
  const resB = b.width * b.height;
  if (resB !== resA) return resB - resA;
  const timeDiff = b.lastUsedAt.getTime() - a.lastUsedAt.getTime();
  if (timeDiff !== 0) return timeDiff;
  return a.id.localeCompare(b.id);
}

function buildEmbedding(tags: string[], dimensions: number): number[] {
  const dim = Math.max(1, dimensions || DEFAULT_EMBED_DIMENSIONS);
  const vector = new Float32Array(dim);

  for (const tag of tags) {
    const token = tag.trim();
    if (!token) continue;
    const grams: string[] = [];
    if (token.length <= 3) {
      grams.push(token);
    } else {
      for (let i = 0; i <= token.length - 3; i++) {
        grams.push(token.slice(i, i + 3));
      }
    }

    for (const gram of grams) {
      const h = hashStringToInt(gram);
      const idxA = Math.abs(h) % dim;
      const idxB = Math.abs((h >>> 4) ^ (h << 5)) % dim;
      vector[idxA] += 1;
      vector[idxB] += 0.5;
    }
  }

  let normSq = 0;
  for (const v of vector) normSq += v * v;
  if (normSq === 0) return [];
  const norm = Math.sqrt(normSq);
  return Array.from(vector, v => v / norm);
}

function hashStringToInt(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function mergeAndDedupe<T extends { id: string; score: number }>(primary: T[], secondary: T[]): T[] {
  const byId = new Map<string, T>();
  for (const candidate of [...primary, ...secondary]) {
    const existing = byId.get(candidate.id);
    if (!existing || candidate.score > existing.score) {
      byId.set(candidate.id, candidate);
    }
  }
  return Array.from(byId.values());
}

function mapImageRecord(image: Image, tags: ImageTag[]): LocalImageRecord {
  return {
    type: 'image',
    id: image.id,
    sha256: image.sha256,
    originalSha256: image.originalSha256,
    filename: image.filename,
    ext: image.ext,
    path: image.path,
    thumbPath: image.thumbPath ?? undefined,
    bytes: image.bytes,
    width: image.width,
    height: image.height,
    provider: image.provider,
    sourceUrl: image.sourceUrl ?? undefined,
    embedding: image.embedding ?? [],
    tags: tags.map(t => t.tag),
    createdAt: image.createdAt,
    lastUsedAt: image.lastUsedAt,
  };
}

function mapVideoRecord(video: Video, tags: VideoTag[]): LocalVideoRecord {
  return {
    type: 'video',
    id: video.id,
    sha256: video.sha256,
    originalSha256: video.originalSha256,
    filename: video.filename,
    ext: video.ext,
    path: video.path,
    thumbPath: video.thumbPath ?? undefined,
    bytes: video.bytes,
    width: video.width,
    height: video.height,
    provider: video.provider,
    sourceUrl: video.sourceUrl ?? undefined,
    embedding: video.embedding ?? [],
    tags: tags.map(t => t.tag),
    createdAt: video.createdAt,
    lastUsedAt: video.lastUsedAt,
    durationMs: video.durationMs,
    fps: video.fps,
    videoCodec: video.videoCodec,
    audioCodec: video.audioCodec,
    bitrate: video.bitrate,
    hasAudio: video.hasAudio,
  };
}

function mergeTags(
  existing: Array<ImageTag | VideoTag>,
  additional: string[],
  kind: MediaKind,
  ownerId: string
): Array<ImageTag | VideoTag> {
  const existingSet = new Set(existing.map(t => t.tag));
  const merged = [...existing];
  for (const tag of additional) {
    if (!existingSet.has(tag)) {
      merged.push(
        kind === 'image'
          ? ({ imageId: ownerId, tag } as ImageTag)
          : ({ videoId: ownerId, tag } as VideoTag)
      );
      existingSet.add(tag);
    }
  }
  return merged;
}

async function aggregateBytes(prisma: PrismaClient, kind: MediaKind): Promise<{ bytes: number; count: number }> {
  if ((prisma as any)[kind].aggregate) {
    const agg = await (prisma as any)[kind].aggregate({
      _sum: { bytes: true },
      _count: { id: true },
    });
    return { bytes: agg._sum?.bytes ?? 0, count: agg._count?.id ?? 0 };
  }

  // Fallback for lightweight fake client
  const rows = await (prisma as any)[kind].findMany?.({ select: { bytes: true } });
  if (rows && Array.isArray(rows)) {
    const bytes = rows.reduce((sum: number, row: any) => sum + (row.bytes || 0), 0);
    return { bytes, count: rows.length };
  }

  return { bytes: 0, count: 0 };
}

async function collectProtectedLibraryIds(): Promise<Set<string>> {
  const protectedIds = new Set<string>();
  const projectsRoot = path.join(process.cwd(), 'public', 'projects');
  if (!(await fs.pathExists(projectsRoot))) return protectedIds;

  const projectDirs = await fs.readdir(projectsRoot).catch(() => []);
  for (const dir of projectDirs) {
    const tagsPath = path.join(projectsRoot, dir, 'tags.json');
    const manifestPath = path.join(projectsRoot, dir, 'manifest.json');
    for (const candidate of [tagsPath, manifestPath]) {
      if (!(await fs.pathExists(candidate))) continue;
      try {
        const data = JSON.parse(await fs.readFile(candidate, 'utf-8'));
        const manifest = data.manifest || data;
        const collect = (arr?: Array<{ libraryId?: string }>) => {
          for (const item of arr || []) {
            if (item.libraryId) protectedIds.add(item.libraryId);
          }
        };
        collect(manifest.images);
        collect(manifest.videos);
      } catch {
        // ignore malformed manifests
      }
    }
  }
  return protectedIds;
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

function readEnvNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}
