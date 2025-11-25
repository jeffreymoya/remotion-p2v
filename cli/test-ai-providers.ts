#!/usr/bin/env tsx

/**
 * Test script for AI provider CLI integrations
 * Tests basic completion and structured output with Zod validation
 */

import { z } from 'zod';
import { AIProviderFactory } from './services/ai';
import { CLIValidator } from './utils/cli-validation';
import { logger } from './utils/logger';

// Test schema for structured output
const PersonSchema = z.object({
  name: z.string(),
  age: z.number().int().positive(),
  occupation: z.string(),
  hobbies: z.array(z.string()).min(1),
});

type Person = z.infer<typeof PersonSchema>;

async function testProvider(providerName: string): Promise<void> {
  logger.info(`\n${'='.repeat(60)}`);
  logger.info(`Testing ${providerName} provider`);
  logger.info('='.repeat(60));

  try {
    // Get provider instance
    const provider = await AIProviderFactory.getProvider(providerName);

    // Test 1: Simple completion
    logger.info('\nTest 1: Simple text completion');
    const simplePrompt = 'What is 2 + 2? Answer in one sentence.';
    const simpleResult = await provider.complete(simplePrompt);
    logger.info(`Result: ${simpleResult}`);

    // Test 2: Structured completion with Zod validation
    logger.info('\nTest 2: Structured completion with Zod validation');
    const structuredPrompt = `Create a fictional person profile with the following fields:
- name (string)
- age (positive integer)
- occupation (string)
- hobbies (array of strings, at least one)

Return ONLY the JSON object, no additional text.`;

    const person = await provider.structuredComplete<Person>(
      structuredPrompt,
      PersonSchema
    );

    logger.info('Structured result:', person);
    logger.info(`✓ ${providerName} passed all tests!`);
  } catch (error: any) {
    logger.error(`✗ ${providerName} failed:`, error.message);
    if (error.cause) {
      logger.error('Cause:', error.cause.message);
    }
  }
}

async function main() {
  logger.info('AI Provider CLI Integration Test Suite');
  logger.info('=======================================\n');

  // Step 1: Validate CLI installations
  logger.info('Step 1: Validating CLI installations...\n');

  const validation = await CLIValidator.validateAndReport(false);

  if (!validation.allInstalled) {
    logger.warn('\n⚠️  Some CLI tools are not installed. Tests will be skipped for those providers.');
  }

  // Step 2: Test each available provider
  logger.info('\nStep 2: Testing AI providers...\n');

  const readyProviders = await CLIValidator.getReadyProviders();

  if (readyProviders.length === 0) {
    logger.error('No AI providers are available. Please install at least one CLI tool.');
    process.exit(1);
  }

  for (const providerName of readyProviders) {
    await testProvider(providerName);
  }

  // Step 3: Test factory with fallback
  logger.info(`\n${'='.repeat(60)}`);
  logger.info('Testing AI Provider Factory with automatic fallback');
  logger.info('='.repeat(60));

  try {
    const provider = await AIProviderFactory.getProviderWithFallback();
    logger.info(`✓ Successfully initialized provider: ${provider.name}`);

    // Quick test
    const result = await provider.complete('Say hello in one sentence.');
    logger.info(`Result: ${result}`);
  } catch (error: any) {
    logger.error(`✗ Factory fallback failed: ${error.message}`);
  }

  // Summary
  logger.info('\n' + '='.repeat(60));
  logger.info('Test Summary');
  logger.info('='.repeat(60));
  logger.info(`Total providers available: ${readyProviders.length}`);
  logger.info(`Available providers: ${readyProviders.join(', ')}`);

  if (validation.missing.length > 0) {
    logger.warn(`Missing providers: ${validation.missing.join(', ')}`);
  }

  logger.info('\nTest suite completed!');
}

// Run tests
main().catch((error) => {
  logger.error('Test suite failed:', error);
  process.exit(1);
});
