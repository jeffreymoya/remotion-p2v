/**
 * Web Scraping Prompts
 *
 * Specialized prompts for web scraping and image search operations
 */

import { PromptVariables } from '../../cli/lib/prompt-manager';

export interface SearchQueriesPromptVariables extends PromptVariables {
  sceneDescription: string;  // Description of the scene/visual content needed
  tags: string[];            // Visual tags extracted from the scene
  imageCount: number;        // Number of images needed
}

export interface SelectImagePromptVariables {
  sceneDescription: string;  // Description of the scene/visual content needed
  candidates: Array<{
    url: string;
    metadata: {
      width?: number;
      height?: number;
      size?: number;
      format?: string;
      alt?: string;
      title?: string;
    };
  }>;
  criteria: {
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: string;
    qualityThreshold?: number;
  };
}

/**
 * Generate optimal search queries for Google Custom Search
 */
export const generateSearchQueriesPrompt = (vars: SearchQueriesPromptVariables): string => {
  const tagsList = vars.tags.join(', ');
  const queryCount = Math.min(3, Math.max(2, vars.imageCount));

  return `You are an expert at crafting optimal web search queries for finding high-quality images.

Scene Description:
"${vars.sceneDescription}"

Available Tags: ${tagsList}
Images Needed: ${vars.imageCount}

Your task:
Generate ${queryCount} highly effective search queries for Google Custom Search that will find high-quality, relevant images.

Requirements:
- Create ${queryCount} diverse but complementary search queries
- Each query should target the same scene but from different angles
- Use specific, descriptive keywords that return quality results
- Avoid overly generic terms that would return irrelevant results
- Include modifiers like "high resolution", "professional", or specific visual styles when appropriate
- Queries should be concise (3-7 words typically work best)
- Order queries from most to least specific

Examples of good queries:
- "professional sunset mountain landscape" (specific scene)
- "modern office workspace natural light" (environment + lighting)
- "abstract digital technology background" (style + subject)

CRITICAL: Return ONLY this exact JSON structure (no markdown blocks, no extra text):
{
  "queries": [
    "First search query here",
    "Second search query here",
    "Optional third query here"
  ]
}

IMPORTANT: The response must have a "queries" array with ${queryCount} search query strings.`;
};

/**
 * Select the best image from candidates based on scene requirements
 */
export const selectBestImagePrompt = (vars: SelectImagePromptVariables): string => {
  const candidatesInfo = vars.candidates.map((c, idx) => {
    const meta = c.metadata;
    const dims = meta.width && meta.height ? `${meta.width}x${meta.height}` : 'unknown';
    const alt = meta.alt || meta.title || 'no description';
    return `[${idx}] ${c.url}\n    Dimensions: ${dims}, Format: ${meta.format || 'unknown'}\n    Alt text: ${alt}`;
  }).join('\n\n');

  const criteriaText = Object.entries(vars.criteria)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  return `You are an expert at evaluating image quality and relevance for video production.

Scene Description:
"${vars.sceneDescription}"

Selection Criteria:
${criteriaText || '- General quality and relevance'}

Image Candidates:
${candidatesInfo}

Your task:
Analyze each image candidate and select the ONE best image that matches the scene description and meets the quality criteria.

Evaluation factors:
1. Scene Relevance (0-1): How well does the image match the scene description?
   - 1.0 = Perfect match, captures the exact scene
   - 0.7-0.9 = Good match, captures the essence
   - 0.4-0.6 = Partial match, some relevant elements
   - 0.0-0.3 = Poor match, barely relevant

2. Aesthetic Appeal (0-1): Overall visual quality and composition
   - 1.0 = Professional quality, excellent composition, perfect lighting
   - 0.7-0.9 = High quality, good composition, nice visuals
   - 0.4-0.6 = Acceptable quality, basic composition
   - 0.0-0.3 = Low quality, poor composition, technical issues

Consider:
- Image dimensions and aspect ratio suitability for video
- Visual clarity and sharpness
- Color balance and lighting
- Composition and framing
- Relevance to the specific scene needed
- Professional vs amateur quality
- Watermarks or distracting elements (reduce score)

CRITICAL: Return ONLY this exact JSON structure (no markdown blocks, no extra text):
{
  "selectedIndex": 0,
  "reasoning": "Clear explanation of why this image was chosen over others, mentioning specific strengths and how it matches the scene description",
  "scores": {
    "sceneRelevance": 0.95,
    "aestheticAppeal": 0.88
  }
}

IMPORTANT:
- selectedIndex must be a number (0-${vars.candidates.length - 1})
- reasoning must be a detailed string explaining the choice
- scores.sceneRelevance must be a number between 0 and 1
- scores.aestheticAppeal must be a number between 0 and 1`;
};
