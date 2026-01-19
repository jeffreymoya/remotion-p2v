/**
 * Script Builder: Segmentation Prompt
 *
 * Phase 5: Segment the polished script for TTS optimization
 */

export interface SegmentPromptVariables {
  polishedText: string;
  beatBoundaries: Array<{ index: number; start: number; end: number }>;
  targetSegmentCount: number;
}

/**
 * Segmentation prompt for TTS optimization
 */
export const segmentPrompt = (vars: SegmentPromptVariables): string => {
  const beatBoundariesText = vars.beatBoundaries
    .map((b) => `Beat ${b.index}: chars ${b.start}-${b.end}`)
    .join('\n');

  return `You are a script editor optimizing text for text-to-speech (TTS) processing.

**Full Script:**
${vars.polishedText}

**Beat Boundaries (for reference):**
${beatBoundariesText}

**Task:** Divide this script into segments optimized for TTS.

**Requirements:**
- Each segment should be 100-150 words
- Split at natural breakpoints (sentence boundaries, paragraph breaks)
- Never split mid-sentence or mid-thought
- Prefer keeping beat content together when segment size allows
- Aim for ${vars.targetSegmentCount} total segments

**Output Format:**
{
  "segments": [
    {
      "index": 1,
      "text": "Segment text...",
      "wordCount": 142,
      "sourceBeatIds": ["beat-1"]
    }
  ]
}

Return ONLY the JSON, no markdown.`;
};
