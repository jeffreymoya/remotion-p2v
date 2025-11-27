#!/usr/bin/env node
/**
 * Stage 3: Topic Refinement
 *
 * Broadens/refines the selected topic for target audience (age 20-40).
 * Outputs: refined.json
 */

import * as fs from 'fs/promises';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env
import { ConfigManager } from '../lib/config';
import { getProjectPaths } from '../../src/lib/paths';
import { refineTopicPrompt } from '../../config/prompts';

export interface RefinedTopic {
  originalTitle: string;
  refinedTitle: string;
  refinedDescription: string;
  targetAudience: string;
  keyAngles: string[];
  suggestedDuration: number;
  refinedAt: string;
}

export interface RefinedTopicOutput {
  topic: RefinedTopic;
  refinedAt: string;
}

async function main(projectId?: string) {
  try {
    console.log('[REFINE] Starting topic refinement...');

    if (!projectId) {
      console.error('[REFINE] ✗ Error: Missing required argument --project <id>');
      console.log('[REFINE] Usage: npm run refine -- --project <project-id>');
      process.exit(1);
    }

    const paths = getProjectPaths(projectId);

    // Check if selected.json exists
    const selectedExists = await fs.access(paths.selected).then(() => true).catch(() => false);
    if (!selectedExists) {
      console.error(`[REFINE] ✗ Error: selected.json not found at ${paths.selected}`);
      console.log('[REFINE] Please run: npm run curate');
      process.exit(1);
    }

    // Load configuration
    const aiConfig = await ConfigManager.loadAIConfig();
    console.log(`[REFINE] Using AI provider: ${aiConfig.defaultProvider}`);

    // Read selected topic
    const selectedData = JSON.parse(await fs.readFile(paths.selected, 'utf-8'));
    const selectedTopic = selectedData.topic;

    console.log(`[REFINE] Refining topic: "${selectedTopic.title}"`);

    // Initialize AI provider
    const { AIProviderFactory } = await import('../services/ai');
    const { z } = await import('zod');

    console.log('[REFINE] Using AI to refine topic for target audience...');
    const aiProvider = await AIProviderFactory.getProviderWithFallback();

    // Define schema for AI-refined topic
    const RefinedTopicSchema = z.object({
      refinedTitle: z.string(),
      refinedDescription: z.string(),
      targetAudience: z.string(),
      keyAngles: z.array(z.string()).min(3).max(5),
      hooks: z.array(z.string()).min(2).max(3),
      suggestedDuration: z.number().min(600).max(900),
      reasoning: z.string(),
    });

    // Generate prompt using centralized template
    const prompt = refineTopicPrompt({
      title: selectedTopic.title,
      description: selectedTopic.description,
      category: selectedTopic.category,
      targetAudience: 'ages 20-40',
      minDuration: 600,
      maxDuration: 900,
    });

    const refinedResult = await aiProvider.structuredComplete(
      prompt,
      RefinedTopicSchema
    );

    // Build output
    const output: RefinedTopicOutput = {
      topic: {
        originalTitle: selectedTopic.title,
        refinedTitle: refinedResult.refinedTitle,
        refinedDescription: refinedResult.refinedDescription,
        targetAudience: refinedResult.targetAudience,
        keyAngles: refinedResult.keyAngles,
        suggestedDuration: refinedResult.suggestedDuration,
        refinedAt: new Date().toISOString(),
      },
      refinedAt: new Date().toISOString(),
    };

    // Write refined.json
    await fs.writeFile(
      paths.refined,
      JSON.stringify(output, null, 2),
      'utf-8'
    );

    console.log(`[REFINE] ✓ Refined topic: "${output.topic.refinedTitle}"`);
    console.log(`[REFINE] ✓ Target duration: ${output.topic.suggestedDuration}s`);
    console.log(`[REFINE] ✓ Output: ${paths.refined}`);

    process.exit(0);
  } catch (error: any) {
    console.error('[REFINE] ✗ Error:', error.message);
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
