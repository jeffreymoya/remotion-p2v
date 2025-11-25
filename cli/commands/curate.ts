#!/usr/bin/env node
/**
 * Stage 2: Topic Curation
 *
 * Starts a Fastify web interface for user to review and select topics.
 * Outputs: selected.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { getProjectPaths } from '../../src/lib/paths';

export interface SelectedTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  selectedAt: string;
  userNotes?: string;
}

export interface SelectedTopicOutput {
  topic: SelectedTopic;
  selectedAt: string;
}

async function main(projectId?: string, options?: { auto?: boolean; index?: number }) {
  try {
    console.log('[CURATE] Starting topic curation...');

    if (!projectId) {
      console.error('[CURATE] ✗ Error: Missing required argument --project <id>');
      console.log('[CURATE] Usage: npm run curate -- --project <project-id> [--auto] [--index <n>]');
      console.log('[CURATE] Options:');
      console.log('[CURATE]   --auto       Automatically select the top-scored topic');
      console.log('[CURATE]   --index <n>  Select topic at index n (0-based, requires --auto)');
      process.exit(1);
    }

    const paths = getProjectPaths(projectId);

    // Check if discovered.json exists
    const discoveredExists = await fs.access(paths.discovered).then(() => true).catch(() => false);
    if (!discoveredExists) {
      console.error(`[CURATE] ✗ Error: discovered.json not found at ${paths.discovered}`);
      console.log('[CURATE] Please run: npm run discover');
      process.exit(1);
    }

    // Read discovered topics
    const discoveredData = JSON.parse(await fs.readFile(paths.discovered, 'utf-8'));
    console.log(`[CURATE] Found ${discoveredData.totalCount} discovered topic(s)`);

    let selectedTopic: any;
    let userNotes: string | undefined;

    // Auto-select mode
    if (options?.auto) {
      console.log('[CURATE] Auto-selection mode enabled');

      // Sort topics by score (descending)
      const sortedTopics = [...discoveredData.topics].sort((a: any, b: any) => (b.trendScore || b.score || 0) - (a.trendScore || a.score || 0));

      // Select topic by index or default to first (highest scored)
      const index = options.index ?? 0;

      if (index < 0 || index >= sortedTopics.length) {
        throw new Error(`Invalid index ${index}. Must be between 0 and ${sortedTopics.length - 1}`);
      }

      selectedTopic = sortedTopics[index];
      console.log(`[CURATE] Auto-selected topic at index ${index}:`);
      console.log(`[CURATE]   Title: "${selectedTopic.title}"`);
      console.log(`[CURATE]   Score: ${selectedTopic.trendScore || selectedTopic.score || 'N/A'}`);
      console.log(`[CURATE]   Category: ${selectedTopic.category}`);
    } else {
      // Launch Fastify web server for topic selection
      console.log('[CURATE] Starting web UI for topic selection...');

      const { CurationServer } = await import('../services/web/curation-server');
      const { ConfigManager } = await import('../lib/config');

      // Load port from config
      const port = process.env.FASTIFY_PORT ? parseInt(process.env.FASTIFY_PORT, 10) : 3000;

      let selectedTopicId: string | null = null;

      // Create server with callbacks
      const server = new CurationServer({
        port,
        host: '127.0.0.1',
        topics: discoveredData.topics,
        onSelect: (topicId: string, notes?: string) => {
          selectedTopicId = topicId;
          userNotes = notes;
          console.log(`[CURATE] Topic selected: ${topicId}`);

          // Gracefully shutdown server after selection
          setTimeout(() => {
            server.stop();
          }, 1000);
        },
        onClose: () => {
          // Server closed, continue processing
        },
      });

      // Start server
      await server.start();

      // Wait for user to select a topic
      console.log('[CURATE] Waiting for topic selection via web UI...');
      console.log('[CURATE] Press Ctrl+C to cancel');

      // Wait until a topic is selected
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (selectedTopicId) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 500);

        // Handle Ctrl+C gracefully
        process.on('SIGINT', async () => {
          console.log('\n[CURATE] Selection cancelled by user');
          clearInterval(checkInterval);
          await server.stop();
          process.exit(0);
        });
      });

      // Find selected topic
      selectedTopic = discoveredData.topics.find((t: any) => t.id === selectedTopicId);
      if (!selectedTopic) {
        throw new Error(`Selected topic not found: ${selectedTopicId}`);
      }
    }

    // Build output
    const output: SelectedTopicOutput = {
      topic: {
        id: selectedTopic.id,
        title: selectedTopic.title,
        description: selectedTopic.description,
        category: selectedTopic.category,
        selectedAt: new Date().toISOString(),
        userNotes,
      },
      selectedAt: new Date().toISOString(),
    };

    // Write selected.json
    await fs.writeFile(
      paths.selected,
      JSON.stringify(output, null, 2),
      'utf-8'
    );

    console.log(`[CURATE] ✓ Selected topic: "${output.topic.title}"`);
    if (userNotes) {
      console.log(`[CURATE] ✓ User notes: "${userNotes}"`);
    }
    console.log(`[CURATE] ✓ Output: ${paths.selected}`);

    process.exit(0);
  } catch (error: any) {
    console.error('[CURATE] ✗ Error:', error.message);
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const projectIdIndex = args.indexOf('--project');
const projectId = projectIdIndex !== -1 ? args[projectIdIndex + 1] : undefined;

const autoMode = args.includes('--auto');
const indexArg = args.indexOf('--index');
const index = indexArg !== -1 ? parseInt(args[indexArg + 1], 10) : undefined;

// Run if called directly
if (require.main === module) {
  main(projectId, { auto: autoMode, index });
}

export default main;
