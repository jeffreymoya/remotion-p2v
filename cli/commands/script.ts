#!/usr/bin/env node
/**
 * Stage 4: Script Generation
 *
 * Creates a 12-minute script with public speaking techniques.
 * Outputs: scripts/script-v1.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env
import { ConfigManager } from '../lib/config';
import { getProjectPaths, ensureProjectDirs } from '../../src/lib/paths';
import { AIProviderFactory } from '../services/ai';
import { z } from 'zod';
import { generateScriptPrompt } from '../../config/prompts';

export interface ScriptSegment {
  id: string;
  order: number;
  text: string;
  estimatedDurationMs: number;
  speakingNotes?: string;
}

export interface ScriptOutput {
  title: string;
  version: number;
  totalEstimatedDurationMs: number;
  segments: ScriptSegment[];
  generatedAt: string;
}

// Schema for AI-generated script
const ScriptGenerationSchema = z.object({
  segments: z.array(z.object({
    text: z.string(),
    speakingNotes: z.string().optional(),
    estimatedDurationMs: z.number(),
  })),
});

async function main(projectId?: string) {
  try {
    console.log('[SCRIPT] Starting script generation...');

    if (!projectId) {
      console.error('[SCRIPT] ✗ Error: Missing required argument --project <id>');
      console.log('[SCRIPT] Usage: npm run script -- --project <project-id>');
      process.exit(1);
    }

    const paths = getProjectPaths(projectId);
    await ensureProjectDirs(projectId);

    // Check if refined.json exists
    const refinedExists = await fs.access(paths.refined).then(() => true).catch(() => false);
    if (!refinedExists) {
      console.error(`[SCRIPT] ✗ Error: refined.json not found at ${paths.refined}`);
      console.log('[SCRIPT] Please run: npm run refine');
      process.exit(1);
    }

    // Load configuration
    const aiConfig = await ConfigManager.loadAIConfig();
    const videoConfig = await ConfigManager.loadVideoConfig();
    console.log(`[SCRIPT] Using AI provider: ${aiConfig.defaultProvider}`);
    console.log(`[SCRIPT] Target duration: ${videoConfig.duration?.targetSeconds || 720}s`);

    // Read refined topic
    const refinedData = JSON.parse(await fs.readFile(paths.refined, 'utf-8'));
    const refinedTopic = refinedData.topic;

    console.log(`[SCRIPT] Generating script for: "${refinedTopic.refinedTitle}"`);

    // Initialize AI provider
    const aiProvider = await AIProviderFactory.getProviderWithFallback();

    // Generate script using AI
    const targetDuration = videoConfig.duration?.targetSeconds || 720;

    // Generate prompt using centralized template
    const prompt = generateScriptPrompt({
      title: refinedTopic.refinedTitle,
      description: refinedTopic.refinedDescription,
      targetDuration,
      keyAngles: refinedTopic.keyAngles,
    });

    console.log('[SCRIPT] Calling AI to generate script...');

    const scriptResult = await aiProvider.structuredComplete(prompt, ScriptGenerationSchema);

    // Build output with IDs and ordering
    const output: ScriptOutput = {
      title: refinedTopic.refinedTitle,
      version: 1,
      totalEstimatedDurationMs: scriptResult.segments.reduce((sum, s) => sum + s.estimatedDurationMs, 0),
      segments: scriptResult.segments.map((seg, idx) => ({
        id: `segment-${idx + 1}`,
        order: idx + 1,
        text: seg.text,
        estimatedDurationMs: seg.estimatedDurationMs,
        speakingNotes: seg.speakingNotes,
      })),
      generatedAt: new Date().toISOString(),
    };

    // Validate total duration is within acceptable range (10-15 minutes)
    const totalSeconds = output.totalEstimatedDurationMs / 1000;
    if (totalSeconds < 600 || totalSeconds > 900) {
      console.warn(`[SCRIPT] ⚠ Warning: Generated script duration ${totalSeconds}s is outside target range (600-900s)`);
    }

    // Write script to scripts directory
    const scriptPath = path.join(paths.scripts, 'script-v1.json');
    await fs.writeFile(
      scriptPath,
      JSON.stringify(output, null, 2),
      'utf-8'
    );

    console.log(`[SCRIPT] ✓ Generated ${output.segments.length} script segment(s)`);
    console.log(`[SCRIPT] ✓ Total duration: ${totalSeconds}s (${Math.floor(totalSeconds / 60)}m ${Math.floor(totalSeconds % 60)}s)`);
    console.log(`[SCRIPT] ✓ Output: ${scriptPath}`);

    process.exit(0);
  } catch (error: any) {
    console.error('[SCRIPT] ✗ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const projectIdIndex = args.indexOf('--project');
let projectId: string | undefined;

if (projectIdIndex !== -1) {
  // Named argument: --project <id>
  projectId = args[projectIdIndex + 1];
} else if (args.length > 0 && !args[0].startsWith('--')) {
  // Positional argument: <project-id>
  projectId = args[0];
}

// Run if called directly
if (require.main === module) {
  main(projectId);
}

export default main;
