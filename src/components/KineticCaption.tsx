import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import type { WordTiming } from "../lib/tts-google";
import type { Sentence } from "../lib/inspire/inspire-schema";
import { palette } from "./tokens";
import { loadFont } from "@remotion/google-fonts/CormorantGaramond";
import { isQuoteSentence } from "../lib/inspire/art-direction-schema";
import type { CaptionStyle } from "../lib/inspire/art-direction-schema";
import { WORD_VARIANTS } from "./captions";
import type { WordVariant } from "./captions";

const { fontFamily } = loadFont();

const ACTIVE_VARIANT: WordVariant = "fade";

interface KineticCaptionProps {
  frame: number;
  fps: number;
  wordTimings: WordTiming[];
  sentences: Sentence[];
  captionStyleBySentence?: Record<number, CaptionStyle>;
  emphasisBySentence?: Record<number, number[]>;
}

const FADE_FRAMES = 10;
const MAX_GROUP_CHARS = 120;

function cleanDisplayText(text: string): string {
  return text
    .replace(/\\n/g, " ")
    .replace(/\(\s*"[^"]*"\s*\)/g, "")
    .replace(/\.{3,}/g, "")
    .replace(/—/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

interface DisplayGroup {
  text: string;
  sentenceIndexes: number[];
  primarySentenceIndex: number;
  startSeconds: number;
  endSeconds: number;
  startFrame: number;
  endFrame: number;
  tokenWordIndexes: number[];
  isQuote: boolean;
}

function buildDisplayGroups(sentences: Sentence[]): DisplayGroup[] {
  const groups: DisplayGroup[] = [];
  let current: DisplayGroup | null = null;

  for (const s of sentences) {
    const cleaned = s.text.trim();
    const quote = isQuoteSentence(s.text);

    const canMerge =
      current !== null &&
      !quote &&
      !current.isQuote &&
      current.text.length + 1 + cleaned.length <= MAX_GROUP_CHARS;

    if (canMerge && current) {
      current.text = `${current.text} ${cleaned}`;
      current.sentenceIndexes.push(s.sentenceIndex);
      current.endSeconds = s.endSeconds;
      current.endFrame = s.endFrame;
      current.tokenWordIndexes = [
        ...current.tokenWordIndexes,
        ...s.tokenWordIndexes,
      ];
    } else {
      if (current) groups.push(current);
      current = {
        text: cleaned,
        sentenceIndexes: [s.sentenceIndex],
        primarySentenceIndex: s.sentenceIndex,
        startSeconds: s.startSeconds,
        endSeconds: s.endSeconds,
        startFrame: s.startFrame,
        endFrame: s.endFrame,
        tokenWordIndexes: [...s.tokenWordIndexes],
        isQuote: quote,
      };
    }
  }
  if (current) groups.push(current);
  return groups;
}

export const KineticCaption: React.FC<KineticCaptionProps> = ({
  frame,
  fps,
  wordTimings,
  sentences,
  captionStyleBySentence,
  emphasisBySentence,
}) => {
  const t = frame / fps;

  const displayGroups = React.useMemo(
    () => buildDisplayGroups(sentences),
    [sentences],
  );

  const currentGroup =
    displayGroups.find((g) => t >= g.startSeconds && t < g.endSeconds) ??
    displayGroups[displayGroups.length - 1];

  if (!currentGroup) return null;

  const sentenceWords = currentGroup.tokenWordIndexes
    .filter((i) => i < wordTimings.length)
    .map((i) => wordTimings[i]);

  let activeWordIdx = -1;
  for (let i = 0; i < sentenceWords.length; i++) {
    if (t >= sentenceWords[i].startSeconds) {
      activeWordIdx = i;
    }
  }

  const sentenceStartFrame = currentGroup.startFrame;
  const sentenceEndFrame = currentGroup.endFrame;
  const sentenceDuration = sentenceEndFrame - sentenceStartFrame;

  const opacity =
    sentenceDuration > FADE_FRAMES * 2
      ? interpolate(
          frame,
          [
            sentenceStartFrame,
            sentenceStartFrame + FADE_FRAMES,
            sentenceEndFrame - FADE_FRAMES,
            sentenceEndFrame,
          ],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : 1;

  // Quote detection is a deterministic override on top of the LLM directive.
  const llmStyle = captionStyleBySentence?.[currentGroup.primarySentenceIndex];
  const captionStyle: CaptionStyle = currentGroup.isQuote
    ? "hero-quote"
    : (llmStyle ?? "word-by-word");

  if (captionStyle === "hero-quote") {
    const quoteText = cleanDisplayText(currentGroup.text);
    const localBlock = Math.max(0, frame - sentenceStartFrame);
    const blockScale = spring({
      frame: localBlock,
      fps,
      from: 0.92,
      to: 1.0,
      config: { damping: 12, stiffness: 180, mass: 0.8 },
    });
    const blockOpacity = interpolate(
      frame,
      [sentenceStartFrame, sentenceStartFrame + 8],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );

    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "0 120px",
            fontFamily,
            fontSize: 152,
            lineHeight: 1.2,
            textAlign: "center",
            color: palette.text,
            fontWeight: 700,
            fontStyle: "italic",
            transform: `scale(${blockScale})`,
            transformOrigin: "center center",
            opacity: blockOpacity,
            textShadow:
              "0 2px 40px rgba(0,0,0,0.95), 0 0 60px rgba(255,255,255,0.08)",
          }}
        >
          {quoteText}
        </div>
      </AbsoluteFill>
    );
  }

  const emphasisIndexes =
    currentGroup.sentenceIndexes.length === 1
      ? (emphasisBySentence?.[currentGroup.primarySentenceIndex] ?? [])
      : [];

  const WordCaptionComponent = WORD_VARIANTS[ACTIVE_VARIANT];
  return (
    <WordCaptionComponent
      frame={frame}
      fps={fps}
      sentenceWords={sentenceWords}
      activeWordIdx={activeWordIdx}
      emphasisIndexes={emphasisIndexes}
      opacity={opacity}
      sentenceText={currentGroup.text}
    />
  );
};
