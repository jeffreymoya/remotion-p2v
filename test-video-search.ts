/**
 * Test script for video search functionality
 * Wave 2A.2: Verify Pexels and Pixabay video search
 */

import { PexelsService, PixabayService } from './cli/services/media';
import { VideoSearchOptions } from './cli/lib/media-types';
import * as dotenv from 'dotenv';

dotenv.config();

async function testVideoSearch() {
  console.log('=== Testing Video Search (Wave 2A.2) ===\n');

  // Test Pexels Video Search
  if (process.env.PEXELS_API_KEY) {
    console.log('1. Testing Pexels Video Search...');
    const pexels = new PexelsService(process.env.PEXELS_API_KEY);

    const pexelsOptions: VideoSearchOptions = {
      orientation: '16:9',
      perTag: 3,
      minDuration: 5,
    };

    try {
      const pexelsVideos = await pexels.searchVideos('nature', pexelsOptions);
      console.log(`   ✓ Found ${pexelsVideos.length} Pexels videos`);
      if (pexelsVideos.length > 0) {
        const video = pexelsVideos[0];
        console.log(`   - Sample: ${video.id} (${video.width}x${video.height}, ${video.duration}s, ${video.fps}fps)`);
        console.log(`   - Creator: ${video.creator}`);
        console.log(`   - URL: ${video.url.substring(0, 60)}...`);
      }
    } catch (error: any) {
      console.log(`   ✗ Pexels error: ${error.message}`);
    }
  } else {
    console.log('1. ⊘ Pexels API key not found (set PEXELS_API_KEY)');
  }

  console.log('');

  // Test Pixabay Video Search
  if (process.env.PIXABAY_API_KEY) {
    console.log('2. Testing Pixabay Video Search...');
    const pixabay = new PixabayService(process.env.PIXABAY_API_KEY);

    const pixabayOptions: VideoSearchOptions = {
      orientation: '16:9',
      perTag: 3,
    };

    try {
      const pixabayVideos = await pixabay.searchVideos('nature', pixabayOptions);
      console.log(`   ✓ Found ${pixabayVideos.length} Pixabay videos`);
      if (pixabayVideos.length > 0) {
        const video = pixabayVideos[0];
        console.log(`   - Sample: ${video.id} (${video.width}x${video.height}, ${video.duration}s, ${video.fps}fps)`);
        console.log(`   - Creator: ${video.creator}`);
        console.log(`   - URL: ${video.url.substring(0, 60)}...`);
      }
    } catch (error: any) {
      console.log(`   ✗ Pixabay error: ${error.message}`);
    }
  } else {
    console.log('2. ⊘ Pixabay API key not found (set PIXABAY_API_KEY)');
  }

  console.log('\n=== Video Search Test Complete ===');
}

// Run test
testVideoSearch().catch(console.error);
