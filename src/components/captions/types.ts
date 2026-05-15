import type { WordTiming } from "../../lib/tts-google";

export interface WordCaptionProps {
  frame: number;
  fps: number;
  sentenceWords: WordTiming[];
  activeWordIdx: number;
  emphasisIndexes: number[];
  opacity: number;
  sentenceText: string;
}
