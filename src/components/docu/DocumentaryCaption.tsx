import React from "react";
import { interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import type { DocuPalette } from "./docu-tokens";
import { PALETTE_MAP } from "./docu-tokens";
import type { DocuSentence } from "./DocumentaryComposition";

const { fontFamily } = loadFont();

interface DocumentaryCaptionProps {
  frame: number;
  fps: number;
  wordTimings: Array<{
    word: string;
    startSeconds: number;
    endSeconds: number;
  }>;
  sentences: DocuSentence[];
  palette: DocuPalette;
}

export const DocumentaryCaption: React.FC<DocumentaryCaptionProps> = ({
  frame,
  fps,
  wordTimings,
  sentences,
  palette,
}) => {
  const captionAccent = PALETTE_MAP[palette].captionAccent;

  const currentSentence = sentences.find(
    (s) => frame >= s.startFrame && frame < s.endFrame,
  );

  if (!currentSentence) return null;

  const sentenceOpacity = interpolate(
    frame,
    [
      currentSentence.startFrame,
      currentSentence.startFrame + 10,
      currentSentence.endFrame - 10,
      currentSentence.endFrame,
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const sentenceWords = currentSentence.tokenWordIndexes
    .filter((i) => i < wordTimings.length)
    .map((i) => wordTimings[i]);

  let activeWordIdx = -1;
  for (let i = 0; i < sentenceWords.length; i++) {
    if (frame >= sentenceWords[i].startSeconds * fps) {
      activeWordIdx = i;
    }
  }

  const emphasisSet = new Set(currentSentence.emphasisWordIndexes ?? []);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 80,
        right: 80,
        fontFamily,
        fontSize: 52,
        lineHeight: 1.35,
        textAlign: "left",
        textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        opacity: sentenceOpacity,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3em" }}>
        {sentenceWords.map((sw, i) => {
          const isActive = i === activeWordIdx;
          const isEmphasis = emphasisSet.has(i);

          const color = isActive
            ? captionAccent
            : isEmphasis
              ? captionAccent
              : "#e2e8f0";
          const weight = isActive || isEmphasis ? 700 : 400;

          return (
            <span
              key={i}
              style={{ display: "inline-block", color, fontWeight: weight }}
            >
              {sw.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
