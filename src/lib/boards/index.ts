/**
 * Boards Pipeline Services
 *
 * This module provides a clean API for the boards pipeline:
 * - planBoards: Plan board groups from script segments
 * - generateBoardPrompts: Generate AI prompts for board images
 * - detectBoardRegions: Detect regions in board images
 * - buildViewportJson: Build viewport.json from board data
 *
 * @example
 * ```ts
 * import { planBoards, buildViewportJson } from '@/src/lib/boards';
 *
 * const plan = await planBoards(segments);
 * const viewport = await buildViewportJson(plan, regions, triggers, { projectPath });
 * ```
 */

// Plan service - board planning from script segments
export {
  planBoards,
  calculateMetrics,
  detectTopicBreaks,
  groupSegments,
  generateTopicSummary,
  type ScriptSegment,
} from './plan-service';

// Prompts service - generate AI prompts for board images
export {
  generateBoardPrompts,
  analyzeContent,
  generateElements,
  selectElementTypes,
  fillElementDescriptions,
  mapSegmentsToElements,
  buildFullPrompt,
  TOPIC_ELEMENT_MAPPING,
  DETECTIVE_BOARD_STYLE_GUIDE,
} from './prompts-service';

// Regions service - detect regions in board images
export {
  detectBoardRegions,
  detectRegions,
  getImageMetadata,
  buildRegionPromptContext,
  validateRegions,
  validateRegionElementLinks,
  RegionDetectionResponseSchema,
  type ImageMetadata,
} from './regions-service';

// Viewport service - build viewport.json
export {
  buildViewportJson,
  buildViewportJsonFromFiles,
  type ViewportJson,
  type BuildViewportOptions,
} from './viewport-service';

// Trigger service
export * from './trigger-service';
