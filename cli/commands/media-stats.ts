#!/usr/bin/env node
/**
 * Print quick statistics about the local stock media library (counts, bytes, recency).
 */
import * as dotenv from 'dotenv';
import path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

dotenv.config({ path: '.env.local' });
dotenv.config();

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

function parseBudgetBytes(): number {
  if (process.env.LIBRARY_BUDGET_BYTES) {
    const parsed = Number(process.env.LIBRARY_BUDGET_BYTES);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.LIBRARY_BUDGET_GB) {
    const parsed = Number(process.env.LIBRARY_BUDGET_GB);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed * 1024 * 1024 * 1024;
  }
  return 300 * 1024 * 1024 * 1024;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to run media-stats');
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    await prisma.$connect();

    const [imageCount, videoCount, imageSum, videoSum, newestImage, newestVideo] = await Promise.all([
      prisma.image.count(),
      prisma.video.count(),
      prisma.image.aggregate({ _sum: { bytes: true } }),
      prisma.video.aggregate({ _sum: { bytes: true } }),
      prisma.image.findFirst({ orderBy: { lastUsedAt: 'desc' } }),
      prisma.video.findFirst({ orderBy: { lastUsedAt: 'desc' } }),
    ]);
    const budgetBytes = parseBudgetBytes();
    const totalBytes = (imageSum._sum.bytes || 0) + (videoSum._sum.bytes || 0);
    const usedPct = Math.min(100, (totalBytes / budgetBytes) * 100);

    const imageTags = await prisma.imageTag.findMany();
    const videoTags = await prisma.videoTag.findMany();
    const tagCounts: Record<string, number> = {};
    for (const t of [...imageTags, ...videoTags]) {
      tagCounts[(t as any).tag] = (tagCounts[(t as any).tag] || 0) + 1;
    }
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => `${tag} (${count})`);

    console.log('Local Stock Media Library');
    console.log('-------------------------');
    console.log(`Library root: ${process.env.LIBRARY_ROOT || path.resolve('/media/videos')}`);
    console.log(`Images: ${imageCount} (${formatBytes(imageSum._sum.bytes)})`);
    console.log(`Videos: ${videoCount} (${formatBytes(videoSum._sum.bytes)})`);
    console.log(`Budget: ${formatBytes(budgetBytes)} (${usedPct.toFixed(1)}% used)`);
    console.log(`Top tags: ${topTags.length ? topTags.join(', ') : 'n/a'}`);
    if (newestImage) {
      console.log(`Last image used: ${newestImage.lastUsedAt.toISOString()} (${newestImage.id})`);
    }
    if (newestVideo) {
      console.log(`Last video used: ${newestVideo.lastUsedAt.toISOString()} (${newestVideo.id})`);
    }
  } catch (error: any) {
    console.error('[media:stats] Failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end().catch(() => undefined);
  }
}

if (require.main === module) {
  void main();
}

export default main;
