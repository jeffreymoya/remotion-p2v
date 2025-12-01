#!/usr/bin/env node
/**
 * Seed the local stock media library with a few generated assets so gather can
 * reuse them without downloading from providers. Default: 1 video, 3 images.
 */
import * as dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { LocalMediaRepo } from '../services/media/local-repo';
import { generateSampleImage, generateSampleVideo } from '../services/media/sample-generator';

dotenv.config({ path: '.env.local' });
dotenv.config();

interface SeedCounts {
  videos: number;
  images: number;
}

function parseCounts(): SeedCounts {
  const args = process.argv.slice(2);
  const videoIdx = args.indexOf('--videos');
  const imageIdx = args.indexOf('--images');
  return {
    videos: videoIdx !== -1 ? Number(args[videoIdx + 1] || 1) : 1,
    images: imageIdx !== -1 ? Number(args[imageIdx + 1] || 3) : 3,
  };
}

async function main() {
  const counts = parseCounts();
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'library-seed-'));
  const repo = new LocalMediaRepo();

  try {
    await repo.ensureAvailable();
    console.log(`[media:seed] Library root: ${process.env.LIBRARY_ROOT || path.resolve('/media/videos')}`);

    const ingestedVideos = [];
    for (let i = 0; i < counts.videos; i++) {
      const videoPath = path.join(tmp, `seed-video-${i + 1}.mp4`);
      await generateSampleVideo(videoPath, {
        color: i % 2 === 0 ? 'red' : 'blue',
        durationSeconds: 2 + i,
      });
      const record = await repo.ingestVideo(videoPath, ['seed', 'demo', `clip-${i + 1}`], 'seed');
      ingestedVideos.push(record);
    }

    const ingestedImages = [];
    const colors = ['#1e90ff', '#2ecc71', '#e67e22', '#9b59b6'];
    for (let i = 0; i < counts.images; i++) {
      const imgPath = path.join(tmp, `seed-image-${i + 1}.png`);
      await generateSampleImage(imgPath, {
        color: colors[i % colors.length],
        label: `seed-${i + 1}`,
        width: 1600,
        height: 900,
      });
      const record = await repo.ingestImage(imgPath, ['seed', 'photo', `still-${i + 1}`], 'seed');
      ingestedImages.push(record);
    }

    console.log(`[media:seed] Added ${ingestedVideos.length} video(s) and ${ingestedImages.length} image(s).`);
    console.log('[media:seed] Example IDs:');
    if (ingestedVideos[0]) console.log(`  video: ${ingestedVideos[0].id}`);
    if (ingestedImages[0]) console.log(`  image: ${ingestedImages[0].id}`);
  } catch (error: any) {
    console.error('[media:seed] Failed:', error.message);
    process.exit(1);
  } finally {
    await repo.dispose();
    await fs.remove(tmp);
  }
}

if (require.main === module) {
  void main();
}

export default main;
