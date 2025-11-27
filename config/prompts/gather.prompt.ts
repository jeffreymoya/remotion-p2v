/**
 * Asset Gathering Prompts
 *
 * Stage 5: Extract visual tags and metadata from script segments
 */

import { PromptVariables } from '../../cli/lib/prompt-manager';

export interface GatherPromptVariables extends PromptVariables {
  segmentText: string;       // Script segment text
  minTags?: number;          // Minimum number of tags
  maxTags?: number;          // Maximum number of tags
  mediaType?: 'images' | 'videos' | 'both';  // Type of media to search for
}

/**
 * Main prompt for extracting visual tags from script text
 */
export const extractVisualTagsPrompt = (vars: GatherPromptVariables): string => {
  const minTags = vars.minTags || 3;
  const maxTags = vars.maxTags || 5;
  const mediaType = vars.mediaType || 'both';

  return `Extract ${minTags}-${maxTags} visual keywords/tags from this text that would be good for searching stock ${mediaType}:

"${vars.segmentText}"

Return ONLY relevant visual tags (objects, scenes, concepts) as JSON.

CRITICAL: Return ONLY this exact JSON structure (no markdown blocks, no extra text):
{
  "tags": [
    {
      "tag": "visual keyword or scene",
      "confidence": 0.95
    }
  ]
}

IMPORTANT: The response must have a "tags" array. Each tag needs "tag" (string) and "confidence" (number between 0 and 1).`;
};

/**
 * Prompt for extracting cinematic/atmospheric tags
 */
export const extractCinematicTagsPrompt = (vars: GatherPromptVariables): string => {
  return `Extract visual and atmospheric keywords from this script segment for finding cinematic stock footage:

"${vars.segmentText}"

Focus on:
- Visual scenes and environments
- Mood and atmosphere
- Colors and lighting
- Camera angles and movements
- Symbolic or metaphorical visuals

Return ${vars.minTags || 3}-${vars.maxTags || 5} cinematic tags as JSON.

CRITICAL: Return ONLY this exact JSON structure (no markdown blocks, no extra text):
{
  "tags": [
    {
      "tag": "cinematic keyword or atmosphere",
      "confidence": 0.95
    }
  ]
}

IMPORTANT: The response must have a "tags" array. Each tag needs "tag" (string) and "confidence" (number between 0 and 1).`;
};

/**
 * Prompt for extracting B-roll suggestions
 */
export const extractBRollSuggestionsPrompt = (vars: GatherPromptVariables): string => {
  return `Suggest B-roll footage ideas for this voiceover segment:

"${vars.segmentText}"

Provide:
- Specific visual scenes that illustrate the narration
- Supporting imagery that adds context
- Establishing shots and transitions
- Visual metaphors or symbolism

Return ${vars.minTags || 3}-${vars.maxTags || 5} B-roll suggestions as JSON with descriptions.

CRITICAL: Return ONLY this exact JSON structure (no markdown blocks, no extra text):
{
  "tags": [
    {
      "tag": "B-roll scene description",
      "confidence": 0.95
    }
  ]
}

IMPORTANT: The response must have a "tags" array. Each tag needs "tag" (string describing the B-roll) and "confidence" (number between 0 and 1).`;
};

/**
 * Prompt for generating image descriptions for AI image generation
 */
export const generateImageDescriptionsPrompt = (vars: GatherPromptVariables & { style?: string }): string => {
  const style = vars.style || 'photorealistic';

  return `Generate detailed image prompts for AI image generation based on this script segment:

"${vars.segmentText}"

Requirements:
- Create ${vars.minTags || 3}-${vars.maxTags || 5} detailed image descriptions
- Style: ${style}
- Include composition, lighting, and mood details
- Make descriptions specific and vivid
- Ensure images would complement the narration

Return as JSON array with detailed prompts suitable for DALL-E or Midjourney.

CRITICAL: Return ONLY this exact JSON structure (no markdown blocks, no extra text):
{
  "tags": [
    {
      "tag": "Detailed image prompt with composition, lighting, and mood",
      "confidence": 0.95
    }
  ]
}

IMPORTANT: The response must have a "tags" array. Each tag needs "tag" (string with detailed image prompt) and "confidence" (number between 0 and 1).`;
};
