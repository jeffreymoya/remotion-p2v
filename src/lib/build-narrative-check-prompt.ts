import type { Segment } from "./parse-script";

export interface NarrativeCheckResult {
  rawResponse: string;
  totalScore: number;
  enhancedNarrative: string;
}

export function buildNarrativeCheckPrompt(segment: Segment): { system: string; user: string } {
  const system = `You are a video engagement analyst. Given a script segment, score the narrative on viewer retention dimensions and produce an enhanced version.

SCORING CRITERIA:
- Hook type: classify as one of: contradiction, cost_of_ignorance, hidden_mechanism, myth_vs_evidence, none
- Hook score: 1–5 (does the opening line create curiosity or tension?)
- Viewer promise present: yes/no (does the segment explicitly state what the viewer will learn?)
- Promise score: 1–5 (how concrete and compelling is the promise?)
- Retention beats: count of micro-questions, contrast reveals, or reframes between hook and closing
- Total: sum of hook score + promise score + (min(retention_beats, 2) * 5) capped at 20

OUTPUT FORMAT (follow exactly):

SCORE:
- Hook type: <contradiction | cost_of_ignorance | hidden_mechanism | myth_vs_evidence | none>
- Hook score: <n>/5
- Viewer promise present: <yes|no>
- Promise score: <n>/5
- Retention beats: <count>
- Total: <n>/20

ENHANCED NARRATIVE:
<rewritten segment narrative with: explicit hook in the opening sentence, concrete viewer promise in the last sentence ("By the end of this segment, you'll know…"), and at least one retention beat flagged with [BEAT] if segment duration is ≥ 20 seconds>

RULES:
- Preserve the factual content and tone of the original narrative.
- Do not add fabricated statistics or claims.
- Keep the enhanced narrative roughly the same length as the original.
- The viewer promise must be specific to the segment content, not generic.`;

  const user = `Score and enhance the following script segment.

Title: "${segment.title}"
Timeline: ${segment.startSeconds}s – ${segment.endSeconds}s

--- Segment Narrative ---
${segment.narrative}
--- End Narrative ---`;

  return { system, user };
}

export function parseNarrativeCheckResponse(raw: string): NarrativeCheckResult {
  const totalMatch = raw.match(/Total:\s*(\d+)\s*\/\s*20/);
  const totalScore = totalMatch ? parseInt(totalMatch[1], 10) : 0;

  const narrativeMarker = "ENHANCED NARRATIVE:";
  const narrativeIndex = raw.indexOf(narrativeMarker);
  const enhancedNarrative =
    narrativeIndex !== -1
      ? raw.slice(narrativeIndex + narrativeMarker.length).trim()
      : "";

  return { rawResponse: raw, totalScore, enhancedNarrative };
}
