// scripts/generate-test-fixtures.ts
import sharp from 'sharp';
import * as fs from 'fs-extra';
import * as path from 'path';

const FIXTURES_DIR = 'tests/fixtures';

async function generateTestImages() {
  await fs.ensureDir(FIXTURES_DIR);

  console.log('Generating test fixtures...');

  // 1. Perfect 1920x1080 JPEG (~500KB)
  console.log('  Creating test-1920x1080.jpg (1920x1080, ~500KB)...');
  await sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 3,
      background: { r: 100, g: 150, b: 200 },
    },
  })
    .jpeg({ quality: 85 })
    .toFile(path.join(FIXTURES_DIR, 'test-1920x1080.jpg'));

  // 2. High-res 4K WebP (~2MB)
  console.log('  Creating test-3840x2160.webp (4K, ~2MB)...');
  await sharp({
    create: {
      width: 3840,
      height: 2160,
      channels: 3,
      background: { r: 50, g: 100, b: 150 },
    },
  })
    .webp({ quality: 90 })
    .toFile(path.join(FIXTURES_DIR, 'test-3840x2160.webp'));

  // 3. Below minimum 640x480 JPEG (~100KB)
  console.log('  Creating test-640x480.jpg (640x480, ~100KB)...');
  await sharp({
    create: {
      width: 640,
      height: 480,
      channels: 3,
      background: { r: 200, g: 100, b: 50 },
    },
  })
    .jpeg({ quality: 80 })
    .toFile(path.join(FIXTURES_DIR, 'test-640x480.jpg'));

  // 4. Portrait 1080x1920 JPEG
  console.log('  Creating test-portrait-1080x1920.jpg (portrait orientation)...');
  await sharp({
    create: {
      width: 1080,
      height: 1920,
      channels: 3,
      background: { r: 150, g: 50, b: 100 },
    },
  })
    .jpeg({ quality: 85 })
    .toFile(path.join(FIXTURES_DIR, 'test-portrait-1080x1920.jpg'));

  // 5. Tiny file <50KB
  console.log('  Creating test-tiny.jpg (<50KB)...');
  await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 100, g: 100, b: 100 },
    },
  })
    .jpeg({ quality: 50 })
    .toFile(path.join(FIXTURES_DIR, 'test-tiny.jpg'));

  // 6. Exactly minimum dimensions (edge case)
  console.log('  Creating test-exactly-1920x1080.jpg (exact minimum dimensions)...');
  await sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 3,
      background: { r: 120, g: 120, b: 120 },
    },
  })
    .jpeg({ quality: 85 })
    .toFile(path.join(FIXTURES_DIR, 'test-exactly-1920x1080.jpg'));

  // 7. Corrupted JPEG (invalid header - more severely corrupted)
  console.log('  Creating test-corrupted.jpg (invalid/corrupted)...');
  const validJpeg = await fs.readFile(
    path.join(FIXTURES_DIR, 'test-1920x1080.jpg')
  );
  // Create a buffer with invalid JPEG header (valid JPEG starts with FF D8)
  const corruptedBuffer = Buffer.from(validJpeg);
  corruptedBuffer[0] = 0x00; // Corrupt the JPEG magic bytes
  corruptedBuffer[1] = 0x00;
  await fs.writeFile(
    path.join(FIXTURES_DIR, 'test-corrupted.jpg'),
    corruptedBuffer
  );

  console.log('\nTest fixtures generated successfully!');
  console.log('\nGenerated files:');

  // List all generated files with their sizes
  const files = await fs.readdir(FIXTURES_DIR);
  for (const file of files.filter(f => f !== 'README.md')) {
    const filePath = path.join(FIXTURES_DIR, file);
    const stats = await fs.stat(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`  - ${file} (${sizeKB} KB)`);
  }
}

generateTestImages().catch(console.error);
