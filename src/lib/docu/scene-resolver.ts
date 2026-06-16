import { resolveSlotBox, type SlotName } from "../layout/grid";
import {
  zCompositionPlan,
  type Anchor,
  type CompositionPlan,
  type PlannedLayer,
  type PlannedScene,
  type ScenePlan,
  type WordTiming,
} from "../pipeline/schemas";
import type { SentenceDef } from "./tts-pipeline";
import type { DocuSegmentPlan } from "./segment-types";
import { normalizeEmphasisToken, resolveEmphasisIndexes, selectEmphasis } from "./emphasis-detect";

interface ResolveScenePlanInput {
  scenePlan: ScenePlan;
  sentences: SentenceDef[];
  wordTimings: WordTiming[];
  fps: number;
  width: number;
  height: number;
  audioPath: string;
  durationInFrames: number;
  captionsEnabled?: boolean;
  segmentPlans?: DocuSegmentPlan[];
  backgroundAssetRefs?: string[];
}

interface SentenceWordRange {
  startWord: number;
  endWord: number;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9%$]/g, "");
}

function sentenceTokenCount(sentence: SentenceDef): number {
  return sentence.text
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean)
    .length;
}

function buildSentenceWordRanges(sentences: SentenceDef[], wordTimings: WordTiming[]): SentenceWordRange[] {
  const ranges: SentenceWordRange[] = [];
  let cursor = 0;
  for (const sentence of sentences) {
    const count = Math.max(1, sentenceTokenCount(sentence));
    const startWord = Math.min(cursor, Math.max(0, wordTimings.length - 1));
    const endWord = Math.min(wordTimings.length - 1, cursor + count - 1);
    ranges.push({ startWord, endWord: Math.max(startWord, endWord) });
    cursor = endWord + 1;
  }
  return ranges;
}

function sceneSentenceRanges(
  sceneCount: number,
  sentenceCount: number,
  segmentPlans?: DocuSegmentPlan[],
): Array<{ startSentence: number; endSentence: number }> {
  if (segmentPlans && segmentPlans.length === sceneCount) {
    const ranges: Array<{ startSentence: number; endSentence: number }> = [];
    let offset = 0;
    for (const segment of segmentPlans) {
      const startSentence = offset;
      const endSentence = Math.min(sentenceCount - 1, offset + segment.targetSentenceCount - 1);
      ranges.push({ startSentence, endSentence: Math.max(startSentence, endSentence) });
      offset = endSentence + 1;
    }
    return ranges;
  }

  return Array.from({ length: sceneCount }, (_, index) => {
    const startSentence = Math.floor((index * sentenceCount) / sceneCount);
    const nextStart = Math.floor(((index + 1) * sentenceCount) / sceneCount);
    return {
      startSentence,
      endSentence: Math.max(startSentence, nextStart - 1),
    };
  });
}

function defaultSlot(scene: PlannedScene, layer: PlannedLayer): SlotName {
  if (layer.layerRole === "supporting") {
    return scene.focalOwner === "chart" || scene.focalOwner === "metric" ? "sidebar-right" : "lower-third";
  }
  if (scene.focalOwner === "metric") return "center-stat";
  if (scene.focalOwner === "chart") return "main-left";
  if (scene.focalOwner === "person") return "right-half";
  if (scene.focalOwner === "evidence") return "main-right";
  return "full";
}

function anchorDelayFrames(anchor: Anchor, sceneStartSeconds: number, sceneWords: WordTiming[], fps: number): number {
  if (anchor.kind === "sceneStart") return 0;
  if (anchor.kind === "sceneEnd") {
    const last = sceneWords[sceneWords.length - 1];
    return last ? Math.max(0, Math.round((last.endSeconds - sceneStartSeconds) * fps)) : 0;
  }
  if (anchor.kind === "wordIndex") {
    const word = sceneWords[Math.min(sceneWords.length - 1, anchor.index)];
    return word ? Math.max(0, Math.round((word.startSeconds - sceneStartSeconds) * fps)) : 0;
  }
  const target = normalizeWord(anchor.text);
  const found = sceneWords.find((word) => normalizeWord(word.word) === target);
  return found ? Math.max(0, Math.round((found.startSeconds - sceneStartSeconds) * fps)) : 0;
}

function emphasisIndexes(sceneWords: WordTiming[], sentences: SentenceDef[], sentenceRange: { startSentence: number; endSentence: number }): number[] {
  const emphasis = new Set(
    sentences
      .slice(sentenceRange.startSentence, sentenceRange.endSentence + 1)
      .flatMap((sentence) => sentence.emphasis.map(normalizeWord)),
  );
  const indexes: number[] = [];
  sceneWords.forEach((word, index) => {
    if (emphasis.has(normalizeWord(word.word))) indexes.push(index);
  });
  return indexes;
}

export function resolveScenePlan(input: ResolveScenePlanInput): CompositionPlan {
  const sentenceRanges = buildSentenceWordRanges(input.sentences, input.wordTimings);
  const sceneRanges = sceneSentenceRanges(input.scenePlan.scenes.length, input.sentences.length, input.segmentPlans);

  const scenes = input.scenePlan.scenes.map((scene, sceneIndex) => {
    const sentenceRange = sceneRanges[sceneIndex];
    const firstSentenceWords = sentenceRanges[sentenceRange.startSentence];
    const lastSentenceWords = sentenceRanges[sentenceRange.endSentence];
    const startWord = firstSentenceWords?.startWord ?? 0;
    const endWord = lastSentenceWords?.endWord ?? startWord;
    const sceneWords = input.wordTimings.slice(startWord, endWord + 1);
    const firstWord = sceneWords[0];
    const lastWord = sceneWords[sceneWords.length - 1];
    const fromFrame = firstWord ? Math.max(0, Math.floor(firstWord.startSeconds * input.fps)) : 0;
    const sceneEndFrame = lastWord
      ? Math.min(input.durationInFrames, Math.ceil(lastWord.endSeconds * input.fps))
      : Math.min(input.durationInFrames, fromFrame + input.fps);
    const durationInFrames = Math.max(1, sceneEndFrame - fromFrame);
    const sceneStartSeconds = fromFrame / input.fps;

    return {
      id: scene.id,
      role: scene.role,
      focalOwner: scene.focalOwner,
      fromFrame,
      durationInFrames,
      background: {
        ...scene.background,
        assetRef: scene.background.assetRef || input.backgroundAssetRefs?.[sceneIndex] || "",
      },
      layers: scene.layers.map((layer, layerIndex) => {
        const slot = layer.slot ?? defaultSlot(scene, layer);
        return {
          component: layer.component,
          layerRole: layer.layerRole,
          props: layer.props,
          resolvedAnchors: layer.anchors.map((anchor) => ({
            target: anchor.target,
            delayFrames: anchorDelayFrames(anchor.at, sceneStartSeconds, sceneWords, input.fps),
          })),
          slot,
          z: layer.z ?? (layer.layerRole === "primary" ? 10 : 5 + layerIndex),
          box: resolveSlotBox(slot),
        };
      }),
      chrome: scene.chrome,
      wordTimings: sceneWords,
      emphasisWordIndexes: emphasisIndexes(sceneWords, input.sentences, sentenceRange),
      evidenceRefs: scene.evidenceRefs,
      transition: scene.transition,
    };
  });

  return zCompositionPlan.parse({
    fps: input.fps,
    width: input.width,
    height: input.height,
    durationInFrames: input.durationInFrames,
    audioPath: input.audioPath,
    scenes,
    captionsEnabled: input.captionsEnabled ?? false,
  });
}
