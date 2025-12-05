import sharp from 'sharp';
import * as path from 'path';

const fixtures = [
  'test-1920x1080.jpg',
  'test-3840x2160.webp',
  'test-640x480.jpg',
  'test-portrait-1080x1920.jpg',
  'test-tiny.jpg',
  'test-exactly-1920x1080.jpg'
];

async function verifyFixtures() {
  console.log('Verifying image properties:\n');

  for (const fixture of fixtures) {
    const imagePath = path.join('tests/fixtures', fixture);
    try {
      const metadata = await sharp(imagePath).metadata();
      console.log(`✓ ${fixture}`);
      console.log(`  Dimensions: ${metadata.width}x${metadata.height}`);
      console.log(`  Format: ${metadata.format}`);
      console.log();
    } catch (error: any) {
      console.log(`✗ ${fixture}: ${error.message}`);
      console.log();
    }
  }

  console.log('Testing corrupted file:');
  try {
    await sharp('tests/fixtures/test-corrupted.jpg').metadata();
    console.log('✗ test-corrupted.jpg: Should have failed but did not');
  } catch (error: any) {
    console.log('✓ test-corrupted.jpg: Correctly throws error');
    console.log(`  Error: ${error.message}`);
  }
}

verifyFixtures().catch(console.error);
