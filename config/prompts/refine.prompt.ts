/**
 * Topic Refinement Prompts
 *
 * Stage 3: Refine selected topics for target audience
 */

import { PromptVariables } from '../../cli/lib/prompt-manager';

export interface RefinePromptVariables extends PromptVariables {
  title: string;             // Original topic title
  description?: string;      // Original description
  category?: string;         // Topic category
  targetAudience: string;    // Age range or demographic
  minDuration: number;       // Minimum duration in seconds
  maxDuration: number;       // Maximum duration in seconds
}

/**
 * Main prompt for refining a selected topic
 */
export const refineTopicPrompt = (vars: RefinePromptVariables): string => {
  return `You are a YouTube content strategist specializing in educational content for ${vars.targetAudience}.

Original Topic:
Title: ${vars.title}
Description: ${vars.description || 'No description provided'}
Category: ${vars.category || 'General'}

Your task:
1. Refine the title to be more compelling and clickable for YouTube (while staying true to the topic)
2. Write a detailed description (3-4 sentences) explaining what the video will cover
3. Define the target audience more specifically (demographics, interests, pain points)
4. Identify 3-5 key angles or subtopics to cover in the video
5. Suggest 2-3 strong hooks for opening the video (attention-grabbers)
6. Recommend a duration in seconds (${vars.minDuration}-${vars.maxDuration}s / ${Math.floor(vars.minDuration / 60)}-${Math.floor(vars.maxDuration / 60)} minutes)
7. Explain your reasoning for these choices

Requirements:
- Make it educational and engaging for ${vars.targetAudience}
- Focus on evergreen content that stays relevant
- Ensure the topic can sustain ${Math.floor(vars.minDuration / 60)}-${Math.floor(vars.maxDuration / 60)} minutes of quality content
- Use storytelling, examples, and practical insights
- Avoid clickbait - be authentic but compelling`;
};

/**
 * Alternative prompt for viral/trending-focused refinement
 */
export const refineViralTopicPrompt = (vars: RefinePromptVariables): string => {
  return `You are a viral content strategist for YouTube.

Original Topic:
Title: ${vars.title}
Description: ${vars.description || 'No description provided'}

Your task:
1. Craft a highly clickable title that maximizes CTR while staying truthful
2. Write a description that creates curiosity and urgency
3. Identify viral angles and controversial takes (but stay factual)
4. Suggest attention-grabbing hooks that stop the scroll
5. Recommend optimal duration for maximum retention
6. Explain the viral potential and audience psychology

Balance viral appeal with authenticity and value.`;
};
