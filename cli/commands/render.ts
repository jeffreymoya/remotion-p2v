#!/usr/bin/env node
/**
 * Stage 7: Video Rendering
 *
 * Renders the video using Remotion with the assembled timeline.
 * Outputs: output.mp4 (or custom path)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env
import { ConfigManager } from '../lib/config';
import { getProjectPaths } from '../../src/lib/paths';

async function main(projectId?: string, quality?: string, output?: string, preview?: boolean) {
  try {
    console.log('[RENDER] Starting video rendering...');

    if (!projectId) {
      console.error('[RENDER] ✗ Error: Missing required argument --project <id>');
      console.log('[RENDER] Usage: npm run render:project -- --project <project-id> [--quality draft|medium|high|production] [--output path/to/output.mp4] [--preview]');
      process.exit(1);
    }

    const paths = getProjectPaths(projectId);

    // Check if timeline.json exists
    const timelineExists = await fs.access(paths.timeline).then(() => true).catch(() => false);

    if (!timelineExists) {
      console.error(`[RENDER] ✗ Error: timeline.json not found at ${paths.timeline}`);
      console.log('[RENDER] Please run: npm run build:timeline');
      process.exit(1);
    }

    // Load configuration
    const videoConfig = await ConfigManager.loadVideoConfig();
    const renderQuality = quality || videoConfig.rendering?.defaultQuality || 'draft';
    const qualitySettings = videoConfig.rendering?.qualities?.[renderQuality];

    if (!qualitySettings) {
      console.error(`[RENDER] ✗ Error: Unknown quality preset: ${renderQuality}`);
      console.log('[RENDER] Available: draft, medium, high, production');
      process.exit(1);
    }

    console.log(`[RENDER] Project: ${projectId}`);
    console.log(`[RENDER] Timeline: ${paths.timeline}`);
    console.log(`[RENDER] Quality: ${renderQuality} (crf=${qualitySettings.crf}, preset=${qualitySettings.preset})`);

    // Read timeline to get metadata
    const timeline = JSON.parse(await fs.readFile(paths.timeline, 'utf-8'));
    const aspectRatio = timeline.aspectRatio || videoConfig.defaultAspectRatio;
    const durationSeconds = timeline.durationSeconds || (timeline.audio?.[timeline.audio.length - 1]?.endMs / 1000) || 60;
    const fps = videoConfig.aspectRatios?.[aspectRatio]?.fps || 30;

    console.log(`[RENDER] Aspect ratio: ${aspectRatio}`);
    console.log(`[RENDER] Duration: ${durationSeconds}s`);
    console.log(`[RENDER] FPS: ${fps}`);

    if (preview) {
      console.log(`[RENDER] Preview mode: rendering first 10 seconds only`);
    }

    // Prepare output path
    const outputPath = output || path.join(paths.root, preview ? 'preview.mp4' : 'output.mp4');
    console.log(`[RENDER] Output: ${outputPath}`);

    // Build Remotion render command
    const args = [
      'remotion',
      'render',
      projectId,
      outputPath,
      '--codec', qualitySettings.codec,
      '--audio-codec', 'aac',
      '--audio-bitrate', qualitySettings.audioBitrate,
      '--concurrency', videoConfig.rendering?.concurrency?.toString() || '4',
    ];

    // Add codec-specific settings
    if (qualitySettings.codec === 'h264' || qualitySettings.codec === 'h265') {
      args.push('--crf', qualitySettings.crf.toString());
    } else if (qualitySettings.codec === 'prores') {
      args.push('--prores-profile', qualitySettings.preset || 'standard');
    }

    // Add preview frame limit (10 seconds)
    if (preview) {
      const previewFrames = 10 * fps;
      args.push('--frames', `0-${previewFrames}`);
    }

    console.log('[RENDER] Running Remotion render...');
    console.log(`[RENDER] Command: npx ${args.join(' ')}`);

    // Execute Remotion render
    const renderResult = await new Promise<{ code: number; output: string }>((resolve, reject) => {
      const childProcess = spawn('npx', args, {
        cwd: path.resolve(__dirname, '../..'),
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let output = '';
      let lastProgressLine = '';

      childProcess.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;

        // Show progress
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            if (line.includes('Rendered') || line.includes('frame') || line.includes('%')) {
              // Progress line - overwrite previous
              if (lastProgressLine) {
                process.stdout.write('\r' + ' '.repeat(lastProgressLine.length) + '\r');
              }
              process.stdout.write('[RENDER]   ' + line.trim());
              lastProgressLine = line.trim();
            } else {
              // Regular line - print normally
              if (lastProgressLine) {
                console.log(''); // New line after progress
                lastProgressLine = '';
              }
              console.log('[RENDER]   ' + line.trim());
            }
          }
        }
      });

      childProcess.stderr?.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (text.trim()) {
          console.error('[RENDER]   ' + text.trim());
        }
      });

      childProcess.on('close', (code) => {
        if (lastProgressLine) {
          console.log(''); // Final new line
        }
        resolve({ code: code || 0, output });
      });

      childProcess.on('error', (error) => {
        reject(error);
      });
    });

    if (renderResult.code !== 0) {
      console.error('[RENDER] ✗ Rendering failed');
      process.exit(1);
    }

    // Verify output file exists
    const outputExists = await fs.access(outputPath).then(() => true).catch(() => false);
    if (!outputExists) {
      console.error('[RENDER] ✗ Output file was not created');
      process.exit(1);
    }

    // Get output file stats
    const stats = await fs.stat(outputPath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('[RENDER] ✓ Rendering complete!');
    console.log(`[RENDER] ✓ Output: ${outputPath}`);
    console.log(`[RENDER] ✓ File size: ${fileSizeMB} MB`);
    console.log(`[RENDER] ✓ Duration: ${durationSeconds}s`);

    if (preview) {
      console.log('[RENDER] Note: Preview mode - only first 10 seconds rendered');
      console.log('[RENDER] To render full video: npm run render:project -- --project ' + projectId);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('[RENDER] ✗ Error:', error.message);
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const projectIdIndex = args.indexOf('--project');
const projectId = projectIdIndex !== -1 ? args[projectIdIndex + 1] : undefined;

const qualityIndex = args.indexOf('--quality');
const quality = qualityIndex !== -1 ? args[qualityIndex + 1] : undefined;

const outputIndex = args.indexOf('--output');
const output = outputIndex !== -1 ? args[outputIndex + 1] : undefined;

const preview = args.includes('--preview');

// Run if called directly
if (require.main === module) {
  main(projectId, quality, output, preview);
}

export default main;
