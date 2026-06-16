import type { DocuPalette } from "./docu-tokens";
import type { DocuOverlay } from "../../lib/docu/overlays/registry";
import type { DocuSegmentMeta } from "../../lib/docu/segment-types";
import type { InterviewCaptionWord, CitationBlock } from "../../lib/docu/youtube-pipeline";

export interface DocuShot {
  videoPath?: string;
  imagePath?: string;
  mediaType: "video" | "image";
  loop: boolean;
  startFrame: number;
  endFrame: number;
  palette: DocuPalette;
  isInterviewClip?: boolean;
  startFrom?: number;
  captionWords?: InterviewCaptionWord[];
  gradeMode?: "full" | "neutral" | "highlight-safe";
}

export interface DocuClip {
  clipIndex: number;
  startFrame: number;
  endFrame: number;
  shots: DocuShot[];
}

export interface DocuSentence {
  sentenceIndex: number;
  text: string;
  startSeconds: number;
  endSeconds: number;
  startFrame: number;
  endFrame: number;
  clipIndex: number;
  tokenWordIndexes: number[];
  emphasisWordIndexes?: number[];
}

export interface DocuScript {
  slug: string;
  topic: string;
  backgroundMusicPath?: string;
  audioPath?: string;
  wordTimings: Array<{
    word: string;
    startSeconds: number;
    endSeconds: number;
  }>;
  sentences: DocuSentence[];
  clips: DocuClip[];
  overlays: DocuOverlay[];
  segments?: DocuSegmentMeta[];
  citationBlocks?: CitationBlock[];
  durationInFrames: number;
  fps: 30;
  width: 1920;
  height: 1080;
}
