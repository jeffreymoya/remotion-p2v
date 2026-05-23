import type { DocuPalette } from "../../components/docu/docu-tokens";

export interface SentenceScheduleInput {
  startFrame: number;
  endFrame: number;
  palette: DocuPalette;
}

export interface ScheduledShot {
  startFrame: number;
  endFrame: number;
  palette: DocuPalette;
}

const TARGET_SHOT_SECONDS = 2.5;
const FPS = 30;

/**
 * Algorithm A — sentence-bounded uniform shot scheduling.
 *
 * Each sentence gets max(1, round(durationSec / TARGET_SHOT_SECONDS)) shots,
 * subdivided evenly within its frame range. The last shot of each sentence
 * extends to the next sentence's startFrame (absorbing the inter-sentence
 * silence gap) so there are no unowned frames.
 *
 * TTS word timings are the single source of truth: sentence boundaries come
 * from real TTS seconds, never from a stub grid.
 */
export function scheduleShotsForSentences(
  sentences: SentenceScheduleInput[],
  totalDurationFrames: number,
): ScheduledShot[] {
  const shots: ScheduledShot[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const sent = sentences[i];
    const slotEnd =
      i < sentences.length - 1
        ? sentences[i + 1].startFrame
        : totalDurationFrames;

    const sentFrames = sent.endFrame - sent.startFrame;
    const sentSec = sentFrames / FPS;
    const shotCount = Math.max(1, Math.round(sentSec / TARGET_SHOT_SECONDS));

    for (let j = 0; j < shotCount; j++) {
      const isLast = j === shotCount - 1;
      const shotStart =
        sent.startFrame + Math.round((j / shotCount) * sentFrames);
      const shotEnd = isLast
        ? slotEnd
        : sent.startFrame + Math.round(((j + 1) / shotCount) * sentFrames);

      shots.push({ startFrame: shotStart, endFrame: shotEnd, palette: sent.palette });
    }
  }

  return shots;
}
