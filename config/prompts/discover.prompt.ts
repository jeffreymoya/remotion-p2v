/**
 * Topic Discovery Prompts
 *
 * Stage 1: Discover and filter trending topics for video content
 */

import { PromptVariables } from '../../cli/lib/prompt-manager';

export interface DiscoverPromptVariables extends PromptVariables {
  trendsList: string;        // Formatted list of trending topics
  limit: number;             // Number of topics to select
  targetAudience: string;    // Age range or demographic
  videoDuration: number;     // Target video length in minutes
}

/**
 * Main prompt for filtering and enriching trending topics
 */
export const filterTopicsPrompt = (vars: DiscoverPromptVariables): string => {
  return `You are a content strategist for a YouTube channel targeting ${vars.targetAudience}.

Given these trending topics from Google Trends:
${vars.trendsList}

Your task:
1. Select the ${vars.limit} BEST topics for ${vars.videoDuration}-minute engaging YouTube videos
2. Filter out: news, celebrities, sports scores, local events, trending hashtags, overly niche topics
3. Prioritize: educational, tech, science, psychology, history, culture, how-to, explanatory content
4. For each selected topic:
   - Write a compelling title (optimized for YouTube)
   - Write a 2-3 sentence description explaining what the video would cover
   - Assign a category (technology, science, history, culture, psychology, how-to, other)
   - Give a score (0-100) indicating video potential
   - Provide reasoning for why this topic is good for video

Return the top ${vars.limit} topics ranked by score (highest first).

CRITICAL: Return ONLY this exact JSON structure (no markdown blocks, no extra text):
{
  "topics": [
    {
      "title": "Compelling YouTube title here",
      "description": "2-3 sentences explaining what the video would cover",
      "category": "technology",
      "score": 85,
      "reasoning": "Why this topic is good for video"
    }
  ]
}

IMPORTANT REQUIREMENTS:
- The response MUST have a "topics" array containing objects with these exact field names
- The "topics" array MUST contain EXACTLY ${vars.limit} items
- Each item must have: title, description, category, score, reasoning
- Do NOT return fewer than ${vars.limit} topics`;
};

/**
 * Alternative prompt for niche/specialized content discovery
 */
export const filterNicheTopicsPrompt = (vars: DiscoverPromptVariables & { niche: string }): string => {
  return `You are a content strategist for a YouTube channel focused on ${vars.niche}, targeting ${vars.targetAudience}.

Given these trending topics from Google Trends:
${vars.trendsList}

Your task:
1. Select the ${vars.limit} BEST topics that relate to ${vars.niche}
2. Ensure topics are suitable for ${vars.videoDuration}-minute videos
3. For each selected topic:
   - Write a title that appeals to ${vars.niche} enthusiasts
   - Write a 2-3 sentence description
   - Assign a category
   - Give a score (0-100) based on relevance and engagement potential
   - Explain why this topic fits the ${vars.niche} niche

Return the top ${vars.limit} topics ranked by score.

CRITICAL: Return ONLY this exact JSON structure (no markdown blocks, no extra text):
{
  "topics": [
    {
      "title": "Title appealing to ${vars.niche} enthusiasts",
      "description": "2-3 sentences about the video content",
      "category": "relevant category",
      "score": 85,
      "reasoning": "Why this topic fits the ${vars.niche} niche"
    }
  ]
}

IMPORTANT: The response must have a "topics" array containing objects with these exact field names.`;
};
