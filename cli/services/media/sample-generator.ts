import { spawn } from 'node:child_process';
import path from 'path';
import fs from 'fs-extra';
import sharp from 'sharp';
import { logger } from '../../utils/logger';

export interface SampleImageOptions {
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}

export interface SampleVideoOptions {
  width?: number;
  height?: number;
  durationSeconds?: number;
  color?: string;
  fps?: number;
}

/**
 * Generate a simple PNG image for testing/seed purposes.
 */
export async function generateSampleImage(targetPath: string, options: SampleImageOptions = {}): Promise<void> {
  const { width = 1280, height = 720, color = '#3366ff', label = '' } = options;
  await fs.ensureDir(path.dirname(targetPath));

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${color}" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="64" font-family="Arial, sans-serif">${label}</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(targetPath);
}

/**
 * Generate a short solid-color MP4 video using ffmpeg.
 */
export async function generateSampleVideo(targetPath: string, options: SampleVideoOptions = {}): Promise<void> {
  const { width = 1280, height = 720, durationSeconds = 2, color = 'red', fps = 24 } = options;
  await fs.ensureDir(path.dirname(targetPath));

  const args = [
    '-y',
    '-f', 'lavfi',
    '-i', `color=c=${color}:s=${width}x${height}:d=${durationSeconds}`,
    '-vf', `fps=${fps},format=yuv420p`,
    '-movflags', '+faststart',
    targetPath,
  ];

  await new Promise<void>((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: 'ignore' });
    proc.on('error', reject);
    proc.on('exit', code => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg exited with code ${code}`));
    });
  }).catch(err => {
    logger.error(`Failed to generate sample video: ${err.message}`);
    throw err;
  });
}
