import type { ResolvedScene } from "./schemas";
import type { DocumentaryCaptionProps } from "../../components/docu/captions/DocumentaryCaption";

type SceneForCaption = Pick<
  ResolvedScene,
  "fromFrame" | "durationInFrames" | "wordTimings" | "emphasisWordIndexes"
>;
type CaptionShape = Pick<DocumentaryCaptionProps, "wordTimings" | "sentences">;
type Sentence = DocumentaryCaptionProps["sentences"][number];

const SENTENCE_END = /[.?!]["')\]]?$/;

export function buildCaptionProps(scene: SceneForCaption, fps: number): CaptionShape {
  const offset = scene.fromFrame / fps;
  const wordTimings = scene.wordTimings.map((w) => ({
    word: w.word,
    startSeconds: Math.max(0, w.startSeconds - offset),
    endSeconds: Math.max(0, w.endSeconds - offset),
  }));

  const emphasis = new Set(scene.emphasisWordIndexes);
  const raw: Sentence[] = [];
  let start = 0;
  for (let i = 0; i < wordTimings.length; i += 1) {
    const isLast = i === wordTimings.length - 1;
    if (SENTENCE_END.test(scene.wordTimings[i].word) || isLast) {
      const tokenWordIndexes: number[] = [];
      const emphasisWordIndexes: number[] = [];
      for (let j = start; j <= i; j += 1) {
        tokenWordIndexes.push(j);
        if (emphasis.has(j)) emphasisWordIndexes.push(j - start);
      }
      raw.push({
        startFrame: Math.round(wordTimings[start].startSeconds * fps),
        endFrame: Math.round(wordTimings[i].endSeconds * fps),
        tokenWordIndexes,
        emphasisWordIndexes,
      });
      start = i + 1;
    }
  }

  // Make coverage contiguous: first starts at 0, each ends where the next begins,
  // last ends at scene end.
  const sentences: Sentence[] = raw.map((s, k) => {
    const startFrame = k === 0 ? 0 : s.startFrame;
    const endRaw = k === raw.length - 1 ? scene.durationInFrames : raw[k + 1].startFrame;
    return { ...s, startFrame, endFrame: Math.max(startFrame + 1, endRaw) };
  });

  return { wordTimings, sentences };
}
