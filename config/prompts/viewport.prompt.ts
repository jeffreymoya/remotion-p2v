// NOTE: Script "segments" are treated as "sentences" for viewport analysis
// Each segment is a semantic unit from the script generation process

// Type definition for segment timing (computed from script.segments)
export interface SegmentTiming {
  text: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  wpm: number;
}

export function viewportAnalysisPrompt(segmentTimings: SegmentTiming[]): string {
  const segmentList = segmentTimings
    .map((s, i) => `[${i}] "${s.text}" (${s.durationMs}ms)`)
    .join('\n');

  return `You are a cinematographer planning camera movements for a video.

IMAGE: [Attached image file]

NARRATION SCRIPT (with segment timings):
${segmentList}

TASK:
1. Identify 3-8 distinct regions of interest in the image that could serve as focal points
2. Group consecutive segments (indices) that discuss the SAME subject/region
3. Assign each group to a region and determine the tone

REGION DETECTION RULES:
- You MUST return at least 3 regions
- Bounds use normalized coordinates (0-1 range)
- x,y is top-left corner of bounding box
- Include face regions, key objects, text/numbers, action areas
- Regions must keep IoU ≤ 0.2 (at most 20% overlap allowed)
- Consecutive groups MUST NOT target the same region (camera needs to move)

SEGMENT GROUPING RULES:
- Group 1-4 consecutive segments that relate to the same visual focus
- Every segment index (0 to ${segmentTimings.length - 1}) MUST appear in exactly one group
- Groups MUST be in chronological order with no gaps
- Groups MUST cover all segments contiguously (no missing indices)
- Consider natural pause points for transitions

TONE CLASSIFICATION:
- "dramatic": Slow reveals, major statements (needs 1500-3000ms transitions)
- "narrative": Standard storytelling (800-1500ms transitions)
- "action": Fast-paced, energetic (300-600ms transitions)
- "contemplative": Reflective moments (2000-3000ms transitions)
- "energetic": Exciting highlights (400-800ms transitions)

RETURN THIS EXACT JSON STRUCTURE:
{
  "regions": [
    {
      "id": "region-1",
      "label": "descriptive label",
      "bounds": { "x": 0.2, "y": 0.1, "width": 0.3, "height": 0.4 },
      "salience": 0.9
    }
  ],
  "segmentGroups": [
    {
      "segmentIndices": [0, 1],
      "regionId": "region-1",
      "tone": "narrative",
      "focusReason": "These segments describe the subject in region-1"
    }
  ]
}`;
}
