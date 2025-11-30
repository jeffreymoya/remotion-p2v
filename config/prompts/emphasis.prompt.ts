/**
 * Emphasis Tagging Prompts
 *
 * Wave 1.4: Tag words with emphasis levels for TTS rendering
 */

import { PromptVariables } from '../../cli/lib/prompt-manager';

export interface EmphasisPromptVariables extends PromptVariables {
  segmentText: string;       // Script segment text to analyze
  maxHighPercent?: number;   // Maximum percentage of words with high emphasis (default: 5%)
  maxMedPercent?: number;    // Maximum percentage of words with medium emphasis (default: 15%)
  minGapWords?: number;      // Minimum word gap between high-emphasis words (default: 2)
}

/**
 * Main prompt for tagging words with emphasis levels
 */
export const emphasisTaggingPrompt = (segmentText: string): string => {
  return `Analyze this script segment and tag words that should receive vocal emphasis:

"${segmentText}"

EMPHASIS TAGGING RULES:

1. HIGH EMPHASIS (Maximum 5% of words):
   - Numbers and statistics
   - Surprising claims or revelations
   - Calls-to-action (e.g., "subscribe", "click", "join")
   - Critical warnings or alerts
   - Enforce 2-word gap minimum between high-emphasis words

2. MEDIUM EMPHASIS (Maximum 15% of words):
   - Named entities (people, places, brands)
   - Key concepts and technical terms
   - Transition words that signal importance ("however", "crucially", "ultimately")
   - Contrasts and comparisons

3. NEVER EMPHASIZE:
   - Articles (a, an, the)
   - Conjunctions (and, but, or)
   - Prepositions (in, on, at, to, from)
   - Common auxiliary verbs (is, are, was, were)

4. TONE MODIFIERS (optional):
   - "warm": Friendly, inviting emphasis (for CTAs, welcoming statements)
   - "intense": Strong, urgent emphasis (for warnings, critical facts)

CRITICAL: Return ONLY this exact JSON structure (no markdown blocks, no extra text):
{
  "emphasisTags": [
    {
      "wordIndex": 0,
      "level": "high",
      "tone": "intense"
    },
    {
      "wordIndex": 5,
      "level": "med"
    }
  ]
}

IMPORTANT:
- wordIndex is 0-based (first word = 0)
- level must be exactly "med" or "high" (lowercase)
- tone is optional and must be exactly "warm" or "intense" if provided
- Response must have an "emphasisTags" array
- Empty array is valid if no words should be emphasized
- Maintain the 2-word gap rule for high-emphasis words
- Stay within the 5% and 15% limits for high and medium emphasis respectively`;
};

/**
 * Advanced emphasis tagging with configurable parameters
 */
export const emphasisTaggingPromptAdvanced = (vars: EmphasisPromptVariables): string => {
  const maxHighPercent = vars.maxHighPercent || 5;
  const maxMedPercent = vars.maxMedPercent || 15;
  const minGapWords = vars.minGapWords || 2;

  return `Analyze this script segment and tag words that should receive vocal emphasis:

"${vars.segmentText}"

EMPHASIS TAGGING RULES:

1. HIGH EMPHASIS (Maximum ${maxHighPercent}% of words):
   - Numbers and statistics
   - Surprising claims or revelations
   - Calls-to-action (e.g., "subscribe", "click", "join")
   - Critical warnings or alerts
   - Enforce ${minGapWords}-word gap minimum between high-emphasis words

2. MEDIUM EMPHASIS (Maximum ${maxMedPercent}% of words):
   - Named entities (people, places, brands)
   - Key concepts and technical terms
   - Transition words that signal importance ("however", "crucially", "ultimately")
   - Contrasts and comparisons

3. NEVER EMPHASIZE:
   - Articles (a, an, the)
   - Conjunctions (and, but, or)
   - Prepositions (in, on, at, to, from)
   - Common auxiliary verbs (is, are, was, were)

4. TONE MODIFIERS (optional):
   - "warm": Friendly, inviting emphasis (for CTAs, welcoming statements)
   - "intense": Strong, urgent emphasis (for warnings, critical facts)

CRITICAL: Return ONLY this exact JSON structure (no markdown blocks, no extra text):
{
  "emphasisTags": [
    {
      "wordIndex": 0,
      "level": "high",
      "tone": "intense"
    },
    {
      "wordIndex": 5,
      "level": "med"
    }
  ]
}

IMPORTANT:
- wordIndex is 0-based (first word = 0)
- level must be exactly "med" or "high" (lowercase)
- tone is optional and must be exactly "warm" or "intense" if provided
- Response must have an "emphasisTags" array
- Empty array is valid if no words should be emphasized
- Maintain the ${minGapWords}-word gap rule for high-emphasis words
- Stay within the ${maxHighPercent}% and ${maxMedPercent}% limits for high and medium emphasis respectively`;
};

/**
 * Simple emphasis prompt for quick testing
 */
export const emphasisTaggingPromptSimple = (segmentText: string): string => {
  return `Tag important words in this text with emphasis levels (high/med).
Keep it subtle: max 5% high, max 15% med. Avoid articles/conjunctions.

Text: "${segmentText}"

Return JSON: { "emphasisTags": [{ "wordIndex": 0, "level": "high" }] }`;
};
