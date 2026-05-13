import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { WordTiming } from "../lib/tts-google";
import type { Sentence } from "../lib/inspire/inspire-schema";
import { palette } from "./tokens";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

interface KineticCaptionProps {
  frame: number;
  fps: number;
  wordTimings: WordTiming[];
  sentences: Sentence[];
}

const FADE_FRAMES = 10;

function cleanDisplayText(text: string): string {
  return text
    .replace(/\\n/g, " ")
    .replace(/\(\s*"[^"]*"\s*\)/g, "")
    .replace(/\.{3,}/g, "")
    .replace(/—/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export const KineticCaption: React.FC<KineticCaptionProps> = ({
  frame,
  fps,
  wordTimings,
  sentences,
}) => {
  const t = frame / fps;

  // Find current sentence
  const currentSentence =
    sentences.find((s) => t >= s.startSeconds && t < s.endSeconds) ??
    sentences[sentences.length - 1]; // fall back to last sentence after audio ends

  if (!currentSentence) return null;

  // Map sentence tokens to word timings
  const sentenceWords = currentSentence.tokenWordIndexes
    .filter((i) => i < wordTimings.length)
    .map((i) => wordTimings[i]);

  // Active word: largest index where t >= word.startSeconds
  let activeWordIdx = -1;
  for (let i = 0; i < sentenceWords.length; i++) {
    if (t >= sentenceWords[i].startSeconds) {
      activeWordIdx = i;
    }
  }

  // Sentence-level fade: fade out in last FADE_FRAMES, fade in over first FADE_FRAMES
  const sentenceStartFrame = currentSentence.startFrame;
  const sentenceEndFrame = currentSentence.endFrame;
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
      : interpolate(
          frame,
          [sentenceStartFrame, sentenceEndFrame],
          [1, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

  // Reconstruct display words from the sentence text, stripping TTS artifacts
  const displayWords = cleanDisplayText(currentSentence.text)
    .split(/\s+/)
    .map((w) => w.replace(/^["'\(\)]+/, "").replace(/["'\(\)]+$/, ""))
    .filter(Boolean);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        paddingBottom: 120,
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 120px",
          fontFamily,
          fontSize: 64,
          lineHeight: 1.4,
          textAlign: "center",
          gap: "0 18px",
        }}
      >
        {displayWords.map((word, i) => {
          const isActive = i === activeWordIdx;
          const isSpoken = i < activeWordIdx;
          const isUpcoming = i > activeWordIdx;

          return (
            <span
              key={`${currentSentence.sentenceIndex}-${i}`}
              style={{
                color: isActive ? palette.accent : palette.text,
                fontWeight: isActive ? 700 : 400,
                fontSize: isActive ? "1.15em" : "1em",
                opacity: isSpoken ? 0.6 : isUpcoming ? 0.3 : 1,
                transition: "all 0.1s ease",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
