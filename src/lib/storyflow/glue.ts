import { randomUUID } from "crypto";
import stringSimilarity from "string-similarity";
import { BeatDraft, GlueIssue, GlueIssueType } from "./storyflow/script-builder-types";

const ROBOT_WORDS = [
  "Furthermore",
  "Moreover",
  "Additionally",
  "In conclusion",
  "In summary",
  "To summarize",
  "It is important to note",
  "It should be noted",
  "As mentioned earlier",
  "As previously stated",
  "First and foremost",
  "Last but not least",
  "At the end of the day",
  "Moving forward",
  "Going forward",
  "With that being said",
  "That being said",
  "In today's world",
  "In this day and age",
  "Needless to say",
  "Without a doubt",
  "It goes without saying",
];

const ISSUE_SEVERITY: Record<GlueIssueType, "warning" | "error"> = {
  robot_word: "warning",
  seam: "warning",
  repetition: "warning",
  pacing: "warning",
};

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildBeatBoundaries(beatDrafts: BeatDraft[]): Array<{ beatIndex: number; start: number; end: number }> {
  const sorted = [...beatDrafts].sort((a, b) => a.beatIndex - b.beatIndex);
  const boundaries: Array<{ beatIndex: number; start: number; end: number }> = [];
  let cursor = 0;

  sorted.forEach((beat, idx) => {
    const start = cursor;
    const end = start + beat.text.length;
    boundaries.push({ beatIndex: beat.beatIndex, start, end });
    // Add two newlines between beats to approximate stored polishedText
    cursor = end + (idx === sorted.length - 1 ? 0 : 2);
  });

  return boundaries;
}

function findBeatIndexForPosition(boundaries: Array<{ beatIndex: number; start: number; end: number }>, pos: number) {
  const boundary = boundaries.find((b) => pos >= b.start && pos <= b.end);
  return boundary?.beatIndex ?? boundaries[boundaries.length - 1]?.beatIndex ?? 0;
}

function getSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeSentence(sentence: string) {
  return sentence.replace(/[^a-zA-Z0-9\s]/g, "").toLowerCase();
}

export function analyzeGlue(
  polishedText: string,
  beatDrafts: BeatDraft[],
  opts: { includeRepetition?: boolean; includePacing?: boolean } = {}
): GlueIssue[] {
  const issues: GlueIssue[] = [];
  const boundaries = buildBeatBoundaries(beatDrafts);

  // Robot word detection
  ROBOT_WORDS.forEach((phrase) => {
    const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(polishedText))) {
      const start = match.index;
      const end = start + match[0].length;
      issues.push({
        id: `robot-${match.index}-${match[0].length}-${randomUUID()}`,
        type: "robot_word",
        location: {
          beatIndex: findBeatIndexForPosition(boundaries, start),
          charStart: start,
          charEnd: end,
        },
        severity: ISSUE_SEVERITY.robot_word,
        suggestion: "Remove or replace with a natural transition",
        text: match[0],
      });
    }
  });

  // Seam detection between adjacent beats
  const sortedBeats = [...beatDrafts].sort((a, b) => a.beatIndex - b.beatIndex);
  for (let i = 0; i < sortedBeats.length - 1; i++) {
    const prevBeat = sortedBeats[i];
    const nextBeat = sortedBeats[i + 1];

    const prevSentences = getSentences(prevBeat.text);
    const nextSentences = getSentences(nextBeat.text);
    const lastPrev = prevSentences[prevSentences.length - 1];
    const firstNext = nextSentences[0];

    if (!lastPrev || !firstNext) continue;

    const similarity = stringSimilarity.compareTwoStrings(
      normalizeSentence(lastPrev).slice(0, 140),
      normalizeSentence(firstNext).slice(0, 140)
    );

    // Flag if opening of next beat repeats previous closing thought significantly
    if (similarity >= 0.55) {
      const needle = firstNext.slice(0, 80);
      const pos = polishedText.indexOf(needle);
      const start = pos >= 0 ? pos : boundaries[i + 1]?.start ?? 0;
      const end = start + needle.length;

      issues.push({
        id: `seam-${i + 1}-${randomUUID()}`,
        type: "seam",
        location: {
          beatIndex: nextBeat.beatIndex,
          charStart: start,
          charEnd: end,
        },
        severity: ISSUE_SEVERITY.seam,
        suggestion: "Vary the opening of the next beat; avoid repeating the prior closing line",
        text: firstNext,
      });
    }
  }

  // Future: repetition/pacing hooks
  if (opts.includeRepetition) {
    // Simple repetition detector: repeated sentence appearing 2+ times
    const sentenceCounts = new Map<string, number>();
    getSentences(polishedText).forEach((sentence) => {
      const norm = normalizeSentence(sentence);
      sentenceCounts.set(norm, (sentenceCounts.get(norm) || 0) + 1);
      if ((sentenceCounts.get(norm) || 0) === 2 && sentence.length > 20) {
        const start = polishedText.indexOf(sentence);
        const end = start + sentence.length;
        issues.push({
          id: `repeat-${randomUUID()}`,
          type: "repetition",
          location: {
            beatIndex: findBeatIndexForPosition(boundaries, start),
            charStart: start,
            charEnd: end,
          },
          severity: ISSUE_SEVERITY.repetition,
          suggestion: "Rephrase this sentence to avoid repetition",
          text: sentence,
        });
      }
    });
  }

  if (opts.includePacing) {
    // Placeholder pacing heuristic: flag beats longer than 170 words
    const WORD_LIMIT = 170;
    sortedBeats.forEach((beat) => {
      const wordCount = beat.text.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > WORD_LIMIT) {
        const start = boundaries.find((b) => b.beatIndex === beat.beatIndex)?.start ?? 0;
        issues.push({
          id: `pacing-${beat.beatIndex}-${randomUUID()}`,
          type: "pacing",
          location: {
            beatIndex: beat.beatIndex,
            charStart: start,
            charEnd: start + beat.text.length,
          },
          severity: ISSUE_SEVERITY.pacing,
          suggestion: "Trim this beat to keep momentum (target 140 words)",
          text: beat.text,
        });
      }
    });
  }

  return issues;
}
