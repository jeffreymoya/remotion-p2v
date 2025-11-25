#!/usr/bin/env node
/**
 * Stage 7: Video Rendering
 *
 * Renders the video using Remotion with the assembled timeline.
 * Outputs: output.mp4 (or custom path)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigManager } from '../lib/config';
import { getProjectPaths } from '../../src/lib/paths';

async function main(projectId?: string, quality?: string, output?: string) {
  try {
    console.log('[RENDER] Starting video rendering...');

    if (!projectId) {
      console.error('[RENDER] ✗ Error: Missing required argument --project <id>');
      console.log('[RENDER] Usage: npm run render:project -- --project <project-id> [--quality draft|medium|high|production] [--output path/to/output.mp4]');
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

    console.log(`[RENDER] Project: ${projectId}`);
    console.log(`[RENDER] Timeline: ${paths.timeline}`);
    console.log(`[RENDER] Quality: ${renderQuality}`);

    // Read timeline to get metadata
    const timeline = JSON.parse(await fs.readFile(paths.timeline, 'utf-8'));
    const aspectRatio = timeline.aspectRatio || videoConfig.defaultAspectRatio;
    const durationSeconds = timeline.durationSeconds || (timeline.audio?.[timeline.audio.length - 1]?.endMs / 1000) || 60;

    console.log(`[RENDER] Aspect ratio: ${aspectRatio}`);
    console.log(`[RENDER] Duration: ${durationSeconds}s`);

    // TODO: Call Remotion render command
    console.log('[RENDER] ⚠ Remotion rendering not yet implemented - would run:');
    console.log(`[RENDER]   npx remotion render ${projectId} ${output || 'output.mp4'}`);

    // Stub: Just report success
    const outputPath = output || path.join(paths.root, 'output.mp4');
    console.log(`[RENDER] ✓ Would render to: ${outputPath}`);
    console.log(`[RENDER] ✓ To preview in Remotion Studio: npm run dev`);

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

// Run if called directly
if (require.main === module) {
  main(projectId, quality, output);
}

export default main;
