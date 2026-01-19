/**
 * Topic Discovery Prompts
 *
 * Stage 1: Discover and filter trending topics for video content
 */

import { PromptVariables } from '../../src/lib/prompt-manager';

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
 * Variables for topic generalization prompt
 */
export interface GeneralizeTopicsPromptVariables extends PromptVariables {
  topicsWithContext: string;  // JSON string of topics with news items
  suggestionsPerTopic: number;
  targetAudience: string;
  videoDuration: number;
}

/**
 * Prompt for generating generalized video topics from trending topics
 * Takes all topics at once with their news context
 */
export const generalizeTopicsPrompt = (vars: GeneralizeTopicsPromptVariables): string => {
  return `You are a YouTube content strategist specializing in transforming trending news into evergreen, engaging video content for ${vars.targetAudience}.

Given these trending topics with their associated news headlines:
${vars.topicsWithContext}

Your task:
For EACH trending topic, generate ${vars.suggestionsPerTopic} generalized video ideas that:
1. Transform the specific news into a broader, more searchable topic
2. Have evergreen appeal (not tied to specific dates/events)
3. Are suitable for ${vars.videoDuration}-minute educational/explanatory videos
4. Would perform well on YouTube with good search volume

Guidelines for generalization:
- "Oprah says obesity is a disease" → "Is Obesity Actually a Disease? The Science Explained"
- "Celebrity uses weight loss drug" → "How GLP-1 Drugs Are Changing Medicine Forever"
- "Company announces layoffs" → "Why Tech Companies Are Cutting Jobs in 2024"
- Focus on: WHY, HOW, WHAT IF, THE TRUTH ABOUT, EXPLAINED formats

For each suggestion, provide:
- A YouTube-optimized title (compelling, searchable)
- The angle (scientific, controversial, educational, myth-busting, explainer, how-to)
- A brief description of what the video would cover
- Viral potential score (0-100)

CRITICAL: Return ONLY this exact JSON structure (no markdown blocks, no extra text):
{
  "trendingTopics": [
    {
      "originalTrend": "the original trending topic name",
      "traffic": "traffic volume from RSS",
      "suggestions": [
        {
          "title": "YouTube-optimized video title",
          "angle": "scientific|controversial|educational|myth-busting|explainer|how-to",
          "description": "2-3 sentences about what the video would cover",
          "viralPotential": 85
        }
      ]
    }
  ]
}

IMPORTANT:
- Process ALL trending topics provided
- Each topic MUST have exactly ${vars.suggestionsPerTopic} suggestions
- Suggestions should be distinct angles, not variations of the same idea
- Prioritize topics that are educational, thought-provoking, or solve problems`;
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
