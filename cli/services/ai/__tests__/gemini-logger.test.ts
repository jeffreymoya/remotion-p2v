#!/usr/bin/env node
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'fs';
import path from 'path';
import { GeminiLogger, GeminiLogEntry } from '../gemini-logger';

const logger = GeminiLogger.getInstance();
const testLogDir = path.join(process.cwd(), 'logs', 'gemini');

test('GeminiLogger - creates log entry with all required fields', async () => {
  const entry: Omit<GeminiLogEntry, 'timestamp'> = {
    pipelineStage: 'test-stage',
    prompt: 'Test prompt',
    response: 'Test response',
    model: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    maxTokens: 8000,
    duration: 1234,
  };

  await logger.log(entry);

  const today = new Date();
  const logs = await logger.getLogsForDate(today);

  assert.ok(logs.length > 0, 'Should have at least one log entry');
  const lastLog = logs[logs.length - 1];
  assert.strictEqual(lastLog.pipelineStage, 'test-stage');
  assert.strictEqual(lastLog.prompt, 'Test prompt');
  assert.strictEqual(lastLog.response, 'Test response');
  assert.strictEqual(lastLog.model, 'gemini-2.5-flash-lite');
  assert.strictEqual(lastLog.temperature, 0.7);
  assert.strictEqual(lastLog.maxTokens, 8000);
  assert.strictEqual(lastLog.duration, 1234);
  assert.ok(lastLog.timestamp, 'Timestamp should be defined');
});

test('GeminiLogger - sanitizes multimodal image paths in prompts', async () => {
  const multimodalPrompt = '@/path/to/image.png\n\nAnalyze this image';

  await logger.log({
    pipelineStage: 'viewport-analysis',
    prompt: multimodalPrompt,
    response: 'Analysis result',
    model: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    maxTokens: 8000,
  });

  const logs = await logger.getLogsForDate(new Date());
  const lastLog = logs[logs.length - 1];

  assert.strictEqual(lastLog.prompt, 'Analyze this image [with image: /path/to/image.png]');
});

test('GeminiLogger - logs errors with error field', async () => {
  await logger.log({
    pipelineStage: 'test-stage',
    prompt: 'Test prompt',
    response: '[ERROR]',
    model: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    maxTokens: 8000,
    error: 'Test error message',
  });

  const logs = await logger.getLogsForDate(new Date());
  const lastLog = logs[logs.length - 1];

  assert.strictEqual(lastLog.error, 'Test error message');
  assert.strictEqual(lastLog.response, '[ERROR]');
});

test('GeminiLogger - includes metadata if provided', async () => {
  await logger.log({
    pipelineStage: 'test-stage',
    prompt: 'Test prompt',
    response: 'Test response',
    model: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    maxTokens: 8000,
    metadata: {
      customField: 'custom value',
      isRetry: true,
      retryCount: 2,
    },
  });

  const logs = await logger.getLogsForDate(new Date());
  const lastLog = logs[logs.length - 1];

  assert.ok(lastLog.metadata, 'Metadata should be defined');
  assert.strictEqual(lastLog.metadata?.customField, 'custom value');
  assert.strictEqual(lastLog.metadata?.isRetry, true);
  assert.strictEqual(lastLog.metadata?.retryCount, 2);
});

test('GeminiLogger - logResponse includes duration and metadata', async () => {
  const startTime = Date.now() - 1500;

  await logger.logResponse(
    'viewport-analysis',
    'Analyze viewport',
    'Viewport analysis result',
    {
      model: 'gemini-2.5-flash-lite',
      temperature: 0.7,
      maxTokens: 8000,
    },
    startTime,
    'test-log-id-123',
    { additionalData: 'test' }
  );

  const logs = await logger.getLogsForDate(new Date());
  const lastLog = logs[logs.length - 1];

  assert.strictEqual(lastLog.pipelineStage, 'viewport-analysis');
  assert.strictEqual(lastLog.prompt, 'Analyze viewport');
  assert.strictEqual(lastLog.response, 'Viewport analysis result');
  assert.ok(lastLog.duration && lastLog.duration > 1400 && lastLog.duration < 2000, 'Duration should be around 1500ms');
  assert.strictEqual(lastLog.metadata?.logId, 'test-log-id-123');
  assert.strictEqual(lastLog.metadata?.status, 'completed');
  assert.strictEqual(lastLog.metadata?.additionalData, 'test');
});

test('GeminiLogger - logError includes error message and metadata', async () => {
  const startTime = Date.now() - 2000;

  await logger.logError(
    'image-selection',
    'Select best image',
    'Failed to parse JSON',
    {
      model: 'gemini-2.5-flash-lite',
      temperature: 0.7,
      maxTokens: 8000,
    },
    startTime,
    'test-error-id-456',
    { errorType: 'parsing' }
  );

  const logs = await logger.getLogsForDate(new Date());
  const lastLog = logs[logs.length - 1];

  assert.strictEqual(lastLog.pipelineStage, 'image-selection');
  assert.strictEqual(lastLog.prompt, 'Select best image');
  assert.strictEqual(lastLog.response, '[ERROR]');
  assert.strictEqual(lastLog.error, 'Failed to parse JSON');
  assert.ok(lastLog.duration && lastLog.duration > 1900, 'Duration should be at least 1900ms');
  assert.strictEqual(lastLog.metadata?.logId, 'test-error-id-456');
  assert.strictEqual(lastLog.metadata?.status, 'error');
  assert.strictEqual(lastLog.metadata?.errorType, 'parsing');
});

test('GeminiLogger - getLogsByPipelineStage filters correctly', async () => {
  // Create some test logs
  await logger.log({
    pipelineStage: 'viewport-analysis',
    prompt: 'Test 1',
    response: 'Response 1',
    model: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    maxTokens: 8000,
  });

  await logger.log({
    pipelineStage: 'image-selection',
    prompt: 'Test 2',
    response: 'Response 2',
    model: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    maxTokens: 8000,
  });

  await logger.log({
    pipelineStage: 'viewport-analysis',
    prompt: 'Test 3',
    response: 'Response 3',
    model: 'gemini-2.5-flash-lite',
    temperature: 0.7,
    maxTokens: 8000,
  });

  const viewportLogs = await logger.getLogsByPipelineStage('viewport-analysis');

  assert.ok(viewportLogs.length >= 2, 'Should have at least 2 viewport-analysis logs');
  assert.ok(viewportLogs.every((log) => log.pipelineStage === 'viewport-analysis'), 'All logs should be viewport-analysis');
});

test('GeminiLogger - getLogsByPipelineStage returns empty array for non-existent stage', async () => {
  const nonExistentLogs = await logger.getLogsByPipelineStage('non-existent-stage');

  assert.ok(Array.isArray(nonExistentLogs), 'Should return an array');
  assert.strictEqual(nonExistentLogs.length, 0, 'Should be empty');
});

test('GeminiLogger - getLogsForDate returns empty array for future dates', async () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  const logs = await logger.getLogsForDate(futureDate);

  assert.ok(Array.isArray(logs), 'Should return an array');
  assert.strictEqual(logs.length, 0, 'Should be empty');
});

console.log('\n✅ All Gemini logger tests passed!');
