export function boardsPlanPrompt(segments: Array<{ index: number; text: string }>): string {
  const segmentList = segments
    .map(s => `[${s.index}] ${s.text.substring(0, 200)}...`)
    .join('\n\n');

  return `You are analyzing a video script to identify natural topic breaks for visual scene changes.

SCRIPT SEGMENTS:
${segmentList}

TASK:
Identify where MAJOR TOPIC SHIFTS occur between segments. A topic shift means:
- The subject matter changes significantly
- A new chapter or phase begins
- The narrative moves to a different aspect

RULES:
- Only identify SIGNIFICANT breaks, not minor transitions
- Consider 2-5 breaks for a 10-segment script
- Do NOT break between every segment

RETURN FORMAT:
{
  "topicBreaks": [
    {
      "afterSegmentIndex": 2,
      "reason": "Shifts from early career to playing style",
      "confidence": 0.9
    }
  ],
  "segmentSummaries": [
    { "index": 0, "topic": "Introduction" },
    { "index": 1, "topic": "Early career" }
  ]
}`;
}

export function topicSummaryPrompt(segmentTexts: string[]): string {
  return `Summarize the main topic of these script segments in 5-10 words.

SEGMENTS:
${segmentTexts.join('\n---\n')}

Return ONLY the summary, no explanation. Example: "Early career and college achievements"`;
}
