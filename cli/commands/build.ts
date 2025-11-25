#!/usr/bin/env node
/**
 * Stage 6: Timeline Assembly
 *
 * Builds timeline.json from all gathered assets.
 * Outputs: timeline.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigManager } from '../lib/config';
import { getProjectPaths } from '../../src/lib/paths';

// Import timeline types from src (these will be extended in Phase 2)
// For now, use minimal stub types
export interface TimelineElement {
  startMs: number;
  endMs: number;
}

export interface BackgroundElement extends TimelineElement {
  imageUrl?: string;
  videoUrl?: string;
  enterTransition?: 'fade' | 'blur' | 'none';
  exitTransition?: 'fade' | 'blur' | 'none';
}

export interface TextElement extends TimelineElement {
  text: string;
  position: 'top' | 'bottom' | 'center';
}

export interface AudioElement extends TimelineElement {
  audioUrl: string;
}

export interface MusicElement extends TimelineElement {
  musicUrl: string;
  volume: number;
}

export interface Timeline {
  shortTitle: string;
  aspectRatio?: '16:9' | '9:16';
  durationSeconds?: number;
  elements: BackgroundElement[];
  text: TextElement[];
  audio: AudioElement[];
  music?: MusicElement[];
}

async function main(projectId?: string) {
  try {
    console.log('[BUILD] Starting timeline assembly...');

    if (!projectId) {
      console.error('[BUILD] ✗ Error: Missing required argument --project <id>');
      console.log('[BUILD] Usage: npm run build:timeline -- --project <project-id>');
      process.exit(1);
    }

    const paths = getProjectPaths(projectId);

    // Check if tags.json exists
    const tagsExists = await fs.access(paths.tags).then(() => true).catch(() => false);
    if (!tagsExists) {
      console.error(`[BUILD] ✗ Error: tags.json not found at ${paths.tags}`);
      console.log('[BUILD] Please run: npm run gather');
      process.exit(1);
    }

    // Load configuration
    const videoConfig = await ConfigManager.loadVideoConfig();
    const musicConfig = await ConfigManager.loadMusicConfig();

    console.log(`[BUILD] Aspect ratio: ${videoConfig.defaultAspectRatio}`);
    console.log(`[BUILD] Target duration: ${videoConfig.duration?.targetSeconds || 720}s`);
    console.log(`[BUILD] Music enabled: ${musicConfig.enabled}`);

    // Read gathered assets
    const tagsData = JSON.parse(await fs.readFile(paths.tags, 'utf-8'));
    const scriptPath = path.join(paths.scripts, 'script-v1.json');
    const scriptData = JSON.parse(await fs.readFile(scriptPath, 'utf-8'));

    console.log(`[BUILD] Building timeline from ${scriptData.segments.length} segment(s)`);

    // TODO: Build actual timeline with frame alignment
    console.log('[BUILD] ⚠ Timeline assembly not yet implemented - using stub data');

    // Stub output: minimal valid timeline
    const timeline: Timeline = {
      shortTitle: scriptData.title,
      aspectRatio: videoConfig.defaultAspectRatio as '16:9' | '9:16',
      durationSeconds: 720,
      elements: [],
      text: [],
      audio: [],
      music: musicConfig.enabled ? [] : undefined,
    };

    // Write timeline.json
    await fs.writeFile(
      paths.timeline,
      JSON.stringify(timeline, null, 2),
      'utf-8'
    );

    console.log(`[BUILD] ✓ Assembled timeline`);
    console.log(`[BUILD] ✓ Duration: ${timeline.durationSeconds}s`);
    console.log(`[BUILD] ✓ Aspect ratio: ${timeline.aspectRatio}`);
    console.log(`[BUILD] ✓ Output: ${paths.timeline}`);

    process.exit(0);
  } catch (error: any) {
    console.error('[BUILD] ✗ Error:', error.message);
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const projectIdIndex = args.indexOf('--project');
const projectId = projectIdIndex !== -1 ? args[projectIdIndex + 1] : undefined;

// Run if called directly
if (require.main === module) {
  main(projectId);
}

export default main;
