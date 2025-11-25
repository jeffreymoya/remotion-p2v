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

Return ONLY relevant visual tags (objects, scenes, concepts) as JSON.`;
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

Return ${vars.minTags || 3}-${vars.maxTags || 5} cinematic tags as JSON.`;
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

Return ${vars.minTags || 3}-${vars.maxTags || 5} B-roll suggestions as JSON with descriptions.`;
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

Return as JSON array with detailed prompts suitable for DALL-E or Midjourney.`;
};
