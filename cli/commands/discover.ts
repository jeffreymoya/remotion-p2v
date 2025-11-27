#!/usr/bin/env node
/**
 * Stage 1: Topic Discovery
 *
 * Fetches trending topics via Google Trends and filters them using AI.
 * Outputs: discovered.json
 */

import * as fs from 'fs/promises';
import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env
import { ConfigManager } from '../lib/config';
import { ensureProjectDirs } from '../../src/lib/paths';
import { GoogleTrendsService } from '../services/trends';
import { AIProviderFactory } from '../services/ai';
import { logger } from '../utils/logger';
import { filterTopicsPrompt } from '../../config/prompts';

export interface DiscoveredTopic {
  id: string;
  title: string;
  description: string;
  source: string;
  trendScore: number;
  category: string;
  discoveredAt: string;
}

export interface DiscoveredTopicsOutput {
  topics: DiscoveredTopic[];
  discoveredAt: string;
  totalCount: number;
}

// Schema for AI-filtered topics
const FilteredTopicsSchema = z.object({
  topics: z.array(z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    score: z.number().min(0).max(100),
    reasoning: z.string(),
  })),
});

async function main(options: { geo?: string; limit?: number } = {}) {
  try {
    console.log('[DISCOVER] Starting topic discovery...');

    const { geo = 'US', limit = 10 } = options;

    // Load configuration
    const aiConfig = await ConfigManager.loadAIConfig();
    console.log(`[DISCOVER] Using AI provider: ${aiConfig.defaultProvider}`);
    console.log(`[DISCOVER] Target region: ${geo}`);

    // Create project directory
    const projectId = `project-${Date.now()}`;
    const paths = ensureProjectDirs(projectId);

    console.log(`[DISCOVER] Created project: ${projectId}`);

    // Step 1: Fetch trending topics from Google Trends
    console.log('[DISCOVER] Fetching trending topics from Google Trends...');
    const trendsService = new GoogleTrendsService();
    const rawTrends = await trendsService.fetchTrendsWithFallback({ geo });

    if (rawTrends.length === 0) {
      throw new Error('No trending topics found from Google Trends');
    }

    console.log(`[DISCOVER] Found ${rawTrends.length} raw trending topics`);

    // Step 2: Use AI to filter and enrich topics
    console.log('[DISCOVER] Using AI to filter and enrich topics...');
    const aiProvider = await AIProviderFactory.getProviderWithFallback();

    // Format trending topics as a numbered list
    const trendsList = rawTrends
      .map((t, i) => `${i + 1}. ${t.query} (traffic: ${t.traffic})`)
      .join('\n');

    // Generate prompt using centralized template
    const prompt = filterTopicsPrompt({
      trendsList,
      limit,
      targetAudience: 'ages 20-40',
      videoDuration: 12,
    });

    const filteredResult = await aiProvider.structuredComplete(
      prompt,
      FilteredTopicsSchema
    );

    // Step 3: Build output with IDs and timestamps
    const output: DiscoveredTopicsOutput = {
      topics: filteredResult.topics.map((topic, idx) => ({
        id: `topic-${idx + 1}`,
        title: topic.title,
        description: topic.description,
        source: 'google-trends',
        trendScore: topic.score,
        category: topic.category,
        discoveredAt: new Date().toISOString(),
      })),
      discoveredAt: new Date().toISOString(),
      totalCount: filteredResult.topics.length,
    };

    // Write discovered.json
    await fs.writeFile(
      paths.discovered,
      JSON.stringify(output, null, 2),
      'utf-8'
    );

    console.log(`[DISCOVER] ✓ Discovered and filtered ${output.totalCount} topic(s)`);
    console.log('[DISCOVER] Top 3 topics:');
    output.topics.slice(0, 3).forEach((topic, idx) => {
      console.log(`  ${idx + 1}. [${topic.category}] ${topic.title} (score: ${topic.trendScore})`);
    });
    console.log(`[DISCOVER] ✓ Output: ${paths.discovered}`);
    console.log(`[DISCOVER] ✓ Project ID: ${projectId}`);

    process.exit(0);
  } catch (error: any) {
    console.error('[DISCOVER] ✗ Error:', error.message);
    if (error.stack) {
      logger.error(error.stack);
    }
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const geoIndex = args.indexOf('--geo');
const limitIndex = args.indexOf('--limit');

const options = {
  geo: geoIndex !== -1 ? args[geoIndex + 1] : undefined,
  limit: limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined,
};

// Run if called directly
if (require.main === module) {
  main(options);
}

export default main;
