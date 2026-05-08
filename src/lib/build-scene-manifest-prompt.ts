import type { Segment } from "./parse-script";

export function buildSceneManifestPrompt(
  segment: Segment,
  segmentSlug: string,
): { system: string; user: string } {
  const system = `You are a video scene planner. Given a script segment narrative, split it into ordered scenes suitable for individual Remotion compositions.

Each scene should cover a discrete narrative beat that can stand as a 5–30 second animation. Scenes must be sequential, non-overlapping, and fully cover the segment's time window.

Output ONLY a JSON object matching this schema:

{
  "segmentTitle": string,
  "segmentSlug": string,
  "segmentStartSeconds": number,
  "segmentEndSeconds": number,
  "scenes": [
    {
      "sceneIndex": 1,
      "sceneSlug": "kebab-case-slug",
      "title": "Human-readable scene title",
      "startSeconds": number,
      "endSeconds": number,
      "narrative": "The narrative content for this scene, from the segment.",
      "visualGoal": "One sentence describing the visual goal of this scene.",
      "ttsText": "Optional TTS narration text if different from narrative."
    },
    ...
  ]
}

Rules:
- sceneIndex must be one-based and sequential (1, 2, 3, ...).
- sceneSlug must be a short kebab-case identifier.
- Scene timings must be ordered, non-overlapping, and fully inside the segment range.
- Every scene must have a meaningful narrative extracted from the segment text.
- visualGoal describes what the Remotion composition should visually achieve (one sentence).
- ttsText is optional; include it only when voiceover narration differs from the narrative.
- estimatedDurationSeconds is optional.
- No markdown fences. JSON only.`;

  const user = `Segment: "${segment.title}" (${segmentSlug})
Timeline: ${segment.startSeconds}s - ${segment.endSeconds}s

Narrative:
${segment.narrative}

Split this into scenes and output the JSON.`;

  return { system, user };
}
