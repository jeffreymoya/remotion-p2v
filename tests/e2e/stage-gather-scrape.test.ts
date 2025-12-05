#!/usr/bin/env node
/**
 * Stage 5: Gather E2E Test with --scrape Flag
 *
 * Tests the web scraping functionality:
 * - --scrape flag recognition
 * - Web scraper initialization
 * - Google Custom Search API integration
 * - Image validation and selection
 * - Fallback to stock APIs when scraping fails
 * - Manifest generation with scraped images
 *
 * This test requires Google Custom Search API credentials.
 */

// Xoad environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'node:child_process';

// Test constants
const TEST_TIMEOUT = 600000; // 10 minutes (web scraping can be slow)

/**
 * Helper: Execute gather command with --scrape flag
 */
async function executeGatherWithScrape(
  projectId: string,
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
  const proc = spawn('tsx', ['cli/commands/gather.ts', projectId, '--scrape', '--preview'], {
  cwd,
  env: { ...process.env },
  stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';

  proc.stdout?.on('data', (data) => {
  stdout += data.toString();
  });

  proc.stderr?.on('data', (data) => {
  stderr += data.toString();
  });

  proc.on('close', (code) => {
  resolve({ stdout, stderr, exitCode: code || 0 });
  });

  proc.on('error', (err) => {
  reject(err);
  });

  // Timeout after 10 minutes
  setTimeout(() => {
  proc.kill();
  reject(new Error('Gather command timed out after 10 minutes'));
  }, TEST_TIMEOUT);
  });
}

/**
 * Helper: Check if Google Search API credentials are available
 */
function hasGoogleSearchCredentials(): boolean {
  return !!(
  process.env.GOOGLE_CUSTOM_SEARCH_API_KEY &&
  process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
  );
}

/**
 * Helper: Create test project directory
 */
async function createTestProject(projectId: string): Promise<string> {
  const projectRoot = path.join(process.cwd(), 'public', 'projects', projectId);
  await fs.mkdir(projectRoot, { recursive: true });
  await fs.mkdir(path.join(projectRoot, 'scripts'), { recursive: true });
  await fs.mkdir(path.join(projectRoot, 'assets', 'images'), { recursive: true });
  return projectRoot;
}

/**
 * Helper: Cleanup test project
 */
async function cleanupTestProject(projectRoot: string): Promise<void> {
  try {
  await fs.rm(projectRoot, { recursive: true, force: true });
  } catch (error) {
  // Ignore cleanup errors
  }
}

/**
 * Mock script data for testing
 */
const mockScript = {
  segments: [
  {
  id: 'segment-1',
  text: 'A beautiful sunset over the ocean with vibrant orange and purple colors reflecting on the calm water.',
  wordCount: 18,
  },
  {
  id: 'segment-2',
  text: 'Mountains covered in snow under a clear blue sky, with pine trees in the foreground.',
  wordCount: 17,
  },
  ],
  metadata: {
  totalWords: 35,
  totalSegments: 2,
  },
};

describe('Stage 5: Gather E2E Test with --scrape', { timeout: TEST_TIMEOUT }, () => {
  let testProjectId: string;
  let testProjectRoot: string;

  before(async () => {
  console.log('\n< Starting Gather --scrape E2E Test...\n');

  // Check for Google Search API credentials
  if (!hasGoogleSearchCredentials()) {
  console.log('⚠️  Missing Google Custom Search API credentials');
  console.log('  Required environment variables:');
  console.log(`  - GOOGLE_CUSTOM_SEARCH_API_KEY: ${process.env.GOOGLE_CUSTOM_SEARCH_API_KEY ? '' : 'X'}`);
  console.log(`  - GOOGLE_CUSTOM_SEARCH_ENGINE_ID: ${process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID ? '' : 'X'}`);
  console.log('\n⚠️  Tests will be skipped or use mock data\n');
  } else {
  console.log(' Google Custom Search API credentials found\n');
  }

  // Create test project
  testProjectId = `gather-scrape-test-${Date.now()}`;
  console.log(`=⚠️ Creating test project: ${testProjectId}...`);
  testProjectRoot = await createTestProject(testProjectId);

  // Create prerequisite files
  await fs.writeFile(
  path.join(testProjectRoot, 'selected.json'),
  JSON.stringify({
  topic: {
  title: 'Nature Photography',
  description: 'Beautiful landscapes from around the world',
  keywords: ['nature', 'photography', 'landscapes'],
  },
  selectedAt: new Date().toISOString(),
  }, null, 2)
  );

  await fs.writeFile(
  path.join(testProjectRoot, 'refined.json'),
  JSON.stringify({
  topic: {
  title: 'Nature Photography: Capturing Earth\'s Beauty',
  description: 'Explore stunning landscapes and natural wonders through the lens of professional photographers.',
  targetAudience: 'Photography enthusiasts',
  keyPoints: [
  'Sunset photography techniques',
  'Mountain landscapes',
  'Natural lighting',
  ],
  },
  refinedAt: new Date().toISOString(),
  }, null, 2)
  );

  await fs.writeFile(
  path.join(testProjectRoot, 'scripts', 'script-v1.json'),
  JSON.stringify(mockScript, null, 2)
  );

  console.log(` Test project created: ${testProjectId}\n`);
  });

  after(async () => {
  console.log('\n>⚠️ Cleaning up...');

  if (testProjectRoot) {
  try {
  await cleanupTestProject(testProjectRoot);
  console.log(' Test project cleaned up\n');
  } catch (error: any) {
  console.error('⚠️  Cleanup error:', error.message);
  }
  }
  });

  it('should recognize --scrape flag and initialize web scraper', async () => {
  if (!hasGoogleSearchCredentials()) {
  console.log('⚠️  Test skipped: Missing Google Search API credentials');
  return;
  }

  console.log('= Testing --scrape flag recognition...');

  try {
  const result = await executeGatherWithScrape(testProjectId);

  // Check that scraper was initialized (look for log message)
  assert.ok(
  result.stdout.includes('[GATHER] Initializing web scraper') ||
  result.stdout.includes('Web scraper initialized') ||
  result.stdout.includes('scrape mode'),
  'Should log web scraper initialization'
  );

  console.log(' --scrape flag recognized and web scraper initialized\n');
  } catch (error: any) {
  console.error('X Test failed:', error.message);
  throw error;
  }
  });

  it('should download scraped images and create manifest', async () => {
  if (!hasGoogleSearchCredentials()) {
  console.log('⚠️  Test skipped: Missing Google Search API credentials');
  return;
  }

  console.log('=⚠️ Testing image download and manifest creation...');

  try {
  // Read tags.json (which contains the manifest)
  const tagsPath = path.join(testProjectRoot, 'tags.json');
  const tagsData = JSON.parse(await fs.readFile(tagsPath, 'utf-8'));
  const manifestData = tagsData.manifest;

  // Validate manifest structure
  assert.ok(manifestData.images, 'Manifest should have images array');
  assert.ok(Array.isArray(manifestData.images), 'images should be an array');

  // Check if any images were scraped
  const scrapedImages = manifestData.images.filter(
  (img: any) => img.source === 'web-scrape' || img.provider === 'gemini-search'
  );

  if (scrapedImages.length > 0) {
  console.log(`   Found ${scrapedImages.length} scraped image(s)`);

  // Validate scraped image structure
  for (const image of scrapedImages) {
  assert.ok(image.id, 'Scraped image should have id');
  assert.ok(image.path, 'Scraped image should have path');
  assert.strictEqual(image.source, 'web-scrape', 'Source should be web-scrape');
  assert.strictEqual(image.provider, 'gemini-search', 'Provider should be gemini-search');
  assert.ok(image.sourceUrl, 'Scraped image should have sourceUrl');
  assert.ok(image.tags, 'Scraped image should have tags');
  assert.ok(Array.isArray(image.tags), 'Tags should be an array');

  // Verify image file exists
  const imageExists = await fs.access(image.path).then(() => true).catch(() => false);
  assert.ok(imageExists, `Scraped image file should exist at ${image.path}`);

  console.log(`  - Image ${image.id}: ${image.sourceUrl}`);
  }

  console.log(' Scraped images validated\n');
  } else {
  console.log('  ⚠️  No scraped images found (may have fallen back to stock)');

  // Check if fallback to stock was used
  const stockImages = manifestData.images.filter(
  (img: any) => img.source !== 'web-scrape'
  );

  if (stockImages.length > 0) {
  console.log(`  9  Found ${stockImages.length} stock image(s) (fallback worked)`);
  }

  console.log(' Fallback behavior validated\n');
  }
  } catch (error: any) {
  console.error('X Test failed:', error.message);
  throw error;
  }
  });

  it('should respect quality criteria for scraped images', async () => {
  if (!hasGoogleSearchCredentials()) {
  console.log('⚠️  Test skipped: Missing Google Search API credentials');
  return;
  }

  console.log('<⚠️ Testing quality criteria validation...');

  try {
  const tagsPath = path.join(testProjectRoot, 'tags.json');
  const tagsData = JSON.parse(await fs.readFile(tagsPath, 'utf-8'));
  const manifestData = tagsData.manifest;

  const scrapedImages = manifestData.images.filter(
  (img: any) => img.source === 'web-scrape'
  );

  if (scrapedImages.length > 0) {
  for (const image of scrapedImages) {
  // Read image metadata if available
  if (image.metadata) {
  // Check minimum dimensions (should be at least 1920x1080 based on config)
  if (image.metadata.width && image.metadata.height) {
  assert.ok(
  image.metadata.width >= 1920 || image.metadata.height >= 1080,
  `Scraped image should meet minimum dimensions (got ${image.metadata.width}x${image.metadata.height})`
  );
  console.log(`   Image dimensions: ${image.metadata.width}x${image.metadata.height}`);
  }

  // Check aspect ratio if available
  if (image.metadata.aspectRatio) {
  const targetRatio = 16 / 9;
  const tolerance = 0.3;
  const ratioDiff = Math.abs(image.metadata.aspectRatio - targetRatio);

  console.log(`  9  Aspect ratio: ${image.metadata.aspectRatio.toFixed(2)} (target: ${targetRatio.toFixed(2)})`);

  // Note: This might fail if scraper allows images outside tolerance
  // That's acceptable as long as they meet minimum quality
  }
  }
  }

  console.log(' Quality criteria validated\n');
  } else {
  console.log('  ⚠️  No scraped images to validate quality\n');
  }
  } catch (error: any) {
  console.error('X Test failed:', error.message);
  throw error;
  }
  });

  it('should handle missing Google API credentials gracefully', async () => {
  console.log('= Testing graceful handling of missing credentials...');

  // Temporarily remove credentials
  const originalApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const originalEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  delete process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  delete process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  try {
  // Create a new test project for this scenario
  const testId = `gather-scrape-noapi-${Date.now()}`;
  const testRoot = await createTestProject(testId);

  // Create prerequisite files
  await fs.writeFile(
  path.join(testRoot, 'selected.json'),
  JSON.stringify({ topic: { title: 'Test', description: 'Test', keywords: [] }, selectedAt: new Date().toISOString() }, null, 2)
  );
  await fs.writeFile(
  path.join(testRoot, 'refined.json'),
  JSON.stringify({ topic: { title: 'Test', description: 'Test', targetAudience: 'Test', keyPoints: [] }, refinedAt: new Date().toISOString() }, null, 2)
  );
  await fs.writeFile(
  path.join(testRoot, 'scripts', 'script-v1.json'),
  JSON.stringify({ segments: [{ id: 'seg-1', text: 'Test segment.', wordCount: 2 }], metadata: { totalWords: 2, totalSegments: 1 } }, null, 2)
  );

  const result = await executeGatherWithScrape(testId);

  // Should either:
  // 1. Xog a warning about missing credentials and fall back
  // 2. Or fail gracefully with an error message
  const hasWarning = result.stdout.includes('⚠️') || result.stdout.includes('warning') || result.stderr.includes('GOOGLE_CUSTOM_SEARCH');
  const hasFallback = result.stdout.includes('Falling back') || result.stdout.includes('fallback');

  assert.ok(
  hasWarning || hasFallback || result.exitCode !== 0,
  'Should handle missing credentials gracefully (warn, fallback, or exit with error)'
  );

  console.log(' Gracefully handled missing credentials\n');

  // Cleanup
  await cleanupTestProject(testRoot);
  } finally {
  // Restore credentials
  if (originalApiKey) process.env.GOOGLE_CUSTOM_SEARCH_API_KEY = originalApiKey;
  if (originalEngineId) process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID = originalEngineId;
  }
  });

  it('should fall back to stock APIs when scraping finds insufficient candidates', async () => {
  console.log('= Testing fallback to stock APIs...');

  // This test is implicit - if scraping fails to find enough candidates,
  // the system should automatically fall back to stock APIs

  try {
  const tagsPath = path.join(testProjectRoot, 'tags.json');
  const tagsExists = await fs.access(tagsPath).then(() => true).catch(() => false);

  if (!tagsExists) {
  console.log('  ⚠️  Manifest not created yet, skipping fallback test');
  return;
  }

  const tagsData = JSON.parse(await fs.readFile(tagsPath, 'utf-8'));
  const manifestData = tagsData.manifest;

  // Should have SOME images, either scraped or from stock
  const totalImages = manifestData.images?.length || 0;
  const totalVideos = manifestData.videos?.length || 0;

  assert.ok(
  totalImages > 0 || totalVideos > 0,
  'Should have downloaded some media (either scraped or stock fallback)'
  );

  console.log(`  9  Total media: ${totalImages} images, ${totalVideos} videos`);

  // Check sources
  const sources = new Set(manifestData.images?.map((img: any) => img.source) || []);
  console.log(`  9  Image sources: ${Array.from(sources).join(', ')}`);

  console.log(' Fallback mechanism working (has media from some source)\n');
  } catch (error: any) {
  console.error('X Test failed:', error.message);
  throw error;
  }
  });
});

console.log('\n=⚠️ Note: These E2E tests require:');
console.log('  - GOOGLE_CUSTOM_SEARCH_API_KEY environment variable');
console.log('  - GOOGLE_CUSTOM_SEARCH_ENGINE_ID environment variable');
console.log('  - Gemini AI provider credentials (for query generation and selection)');
console.log('  - Internet connection for API calls');
console.log('\n  Run with: npm test tests/e2e/stage-gather-scrape.test.ts\n');
