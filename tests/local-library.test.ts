#!/usr/bin/env node
import { beforeEach, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import sharp from 'sharp';
import { LocalMediaRepo } from '../cli/services/media/local-repo';
import { createFakePrismaClient, FakePrismaClient } from './helpers/fake-prisma-client';
import { generateSampleImage, generateSampleVideo } from '../cli/services/media/sample-generator';

let tmpDir: string;
let libraryRoot: string;
let prisma: FakePrismaClient;
let repo: LocalMediaRepo;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'local-library-test-'));
  libraryRoot = path.join(tmpDir, 'library');
  prisma = createFakePrismaClient();
  repo = new LocalMediaRepo({ libraryRoot, prisma, preferRecencyBoost: 0.3 });
});

afterEach(async () => {
  await repo.dispose();
  await fs.remove(tmpDir);
});

test('ingests and deduplicates images with 400px thumb regeneration', async () => {
  const imgPath = path.join(tmpDir, 'img1.png');
  await generateSampleImage(imgPath, { width: 1200, height: 800, color: '#228be6', label: 'one' });

  const first = await repo.ingestImage(imgPath, ['Sunset', 'Beach'], 'seed');
  assert.ok(first.thumbPath, 'thumbnail should be generated');
  const meta = await sharp(first.thumbPath as string).metadata();
  assert.ok((meta.width || 0) <= 400, 'thumbnail width should be <= 400px');

  // Remove thumb to force regeneration on duplicate ingest
  if (first.thumbPath) await fs.remove(first.thumbPath);

  const second = await repo.ingestImage(imgPath, ['Sky'], 'seed');
  assert.strictEqual(first.id, second.id, 'duplicate ingest should return same record');
  assert.ok(second.tags.includes('sky'), 'new tag should be merged');
  assert.ok(second.thumbPath && await fs.pathExists(second.thumbPath), 'thumbnail should be recreated');
});

test('searchVideos prefers recent matches and requires tag overlap', async () => {
  const videoAPath = path.join(tmpDir, 'videoA.mp4');
  const videoBPath = path.join(tmpDir, 'videoB.mp4');
  await generateSampleVideo(videoAPath, { color: 'blue' });
  await generateSampleVideo(videoBPath, { color: 'green' });

  const a = await repo.ingestVideo(videoAPath, ['ocean', 'waves'], 'seed');
  const b = await repo.ingestVideo(videoBPath, ['ocean', 'waves', 'surf'], 'seed');

  // Age video A to reduce recency score
  await prisma.video.updateMany({ where: { id: { in: [a.id] } }, data: { lastUsedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } });

  const results = await repo.searchVideos(['waves', 'surf'], { maxResults: 5 });
  assert.ok(results.length >= 2, 'should return both overlapping videos');
  assert.strictEqual(results[0].id, b.id, 'more recent video should rank first');
});

test('markUsed updates lastUsedAt for images', async () => {
  const imgPath = path.join(tmpDir, 'img2.png');
  await generateSampleImage(imgPath, { width: 800, height: 600, color: '#ff922b', label: 'mark' });
  const record = await repo.ingestImage(imgPath, ['forest'], 'seed');

  // Set an old lastUsedAt
  await prisma.image.updateMany({ where: { id: { in: [record.id] } }, data: { lastUsedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } });
  const before = (await prisma.image.findMany({ where: { sha256: record.sha256 } }))[0].lastUsedAt;

  await repo.markUsed([record.id], 'image');
  const after = (await prisma.image.findMany({ where: { sha256: record.sha256 } }))[0].lastUsedAt;

  assert.ok(after.getTime() > before.getTime(), 'lastUsedAt should be bumped forward');
});

test('searchImages filters out non-overlapping tags', async () => {
  const imgPath = path.join(tmpDir, 'img3.png');
  await generateSampleImage(imgPath, { width: 1024, height: 768, color: '#40c057', label: 'forest' });
  await repo.ingestImage(imgPath, ['forest', 'trees'], 'seed');

  const results = await repo.searchImages(['ocean']);
  assert.strictEqual(results.length, 0, 'no results when tags do not overlap');
});

test('ingestVideo produces 400px poster frame', async () => {
  const videoPath = path.join(tmpDir, 'video-thumb.mp4');
  await generateSampleVideo(videoPath, { color: 'purple', durationSeconds: 1 });

  const record = await repo.ingestVideo(videoPath, ['city', 'night'], 'seed');
  assert.ok(record.thumbPath, 'poster frame should be generated');

  const meta = await sharp(record.thumbPath as string).metadata();
  assert.ok((meta.width || 0) <= 400, 'poster width should be <= 400px');
});

test('blocks ingest when projected size exceeds budget and schedules GC', async () => {
  const oversizedPath = path.join(tmpDir, 'oversized.png');
  await generateSampleImage(oversizedPath, { width: 4000, height: 4000, color: '#ff0000' });
  const stats = await fs.stat(oversizedPath);

  await repo.dispose();
  repo = new LocalMediaRepo({ libraryRoot, prisma, budgetBytes: Math.max(1, stats.size - 1) });

  await assert.rejects(
    () => repo.ingestImage(oversizedPath, ['oversize'], 'seed'),
    /quota exceeded/i
  );

  const state = repo as any;
  assert.ok(state.gcRequested || state.gcInFlight, 'GC should be scheduled after quota rejection');
  await new Promise(resolve => setTimeout(resolve, 10));
});

test('garbageCollect evicts oldest assets to meet budget', async () => {
  const imgOldPath = path.join(tmpDir, 'old.png');
  const imgNewPath = path.join(tmpDir, 'new.png');
  await generateSampleImage(imgOldPath, { width: 3000, height: 2000, color: '#fab005' });
  await generateSampleImage(imgNewPath, { width: 3200, height: 2100, color: '#12b886' });

  const oldRec = await repo.ingestImage(imgOldPath, ['desert'], 'seed');
  const newRec = await repo.ingestImage(imgNewPath, ['forest'], 'seed');

  await prisma.image.updateMany({
    where: { id: { in: [oldRec.id] } },
    data: { lastUsedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });

  const oldSize = (await fs.stat(oldRec.path)).size;
  const newSize = (await fs.stat(newRec.path)).size;

  (repo as any).budgetBytes = newSize + Math.round(newSize * 0.05);

  const result = await repo.garbageCollect();

  assert.strictEqual(result.removed, 1, 'one asset should be removed');
  assert.ok(result.freedBytes >= oldSize * 0.9, 'freed bytes should roughly match oldest asset');

  const remaining = await prisma.image.findMany({ where: { id: { in: [oldRec.id, newRec.id] } } });
  assert.strictEqual(remaining.length, 1, 'one image should remain');
  assert.strictEqual(remaining[0].id, newRec.id, 'newer asset should be kept');

  const oldExists = await fs.pathExists(oldRec.path);
  assert.strictEqual(oldExists, false, 'evicted asset should be removed from disk');
});

test('semantic search falls back when tags do not overlap', async () => {
  await repo.dispose();
  repo = new LocalMediaRepo({
    libraryRoot,
    prisma,
    preferRecencyBoost: 0.2,
    semanticEnabled: true,
    semanticMinScore: 0.05,
    semanticCandidateLimit: 50,
    semanticDimensions: 64,
  });

  const semanticPath = path.join(tmpDir, 'semantic.png');
  await generateSampleImage(semanticPath, { width: 1600, height: 900, color: '#0c8599', label: 'semantic' });
  await repo.ingestImage(semanticPath, ['coastline dawn haze'], 'seed');

  const results = await repo.searchImages(['coast sunset'], { maxResults: 3 });
  assert.ok(results.length >= 1, 'semantic fallback should return a match even without tag overlap');
  assert.ok(results[0].tags.includes('coastline') || results[0].tags.includes('coast'), 'result should come from ingested asset');
});

test('optimizes images when toggle is enabled', async () => {
  await repo.dispose();
  repo = new LocalMediaRepo({
    libraryRoot,
    prisma,
    optimizeImages: true,
    optimizeMinSavingsPercent: 1,
  });

  const imgPath = path.join(tmpDir, 'optimizable.png');
  await generateSampleImage(imgPath, { width: 2400, height: 1350, color: '#dee2e6' });
  const originalSize = (await fs.stat(imgPath)).size;

  const record = await repo.ingestImage(imgPath, ['optimize', 'demo'], 'seed');
  const storedSize = (await fs.stat(record.path)).size;

  assert.ok(storedSize <= originalSize, 'optimized asset should not exceed original size');
  assert.ok(storedSize === record.bytes, 'recorded bytes should match stored file');
});
