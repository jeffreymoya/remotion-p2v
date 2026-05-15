import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { palette } from "../tokens";
import type { WordCaptionProps } from "./types";

const { fontFamily } = loadFont();

const WORD_ENTRANCE_FRAMES = 4;

export const AccumulateCaption: React.FC<WordCaptionProps> = ({
  frame,
  fps,
  sentenceWords,
  activeWordIdx,
  emphasisIndexes,
  opacity,
}) => {
  if (activeWordIdx < 0) return null;

  const visibleWords = sentenceWords.slice(0, activeWordIdx + 1);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", paddingBottom: 120, opacity }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
          gap: "0.3em",
          padding: "0 120px",
          fontFamily,
          fontSize: 72,
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        {visibleWords.map((sw, i) => {
          const isActive = i === activeWordIdx;
          const isEmphasis = emphasisIndexes.includes(i);

          const wordStartFrame = Math.floor(sw.startSeconds * fps);
          const localWordFrame = Math.max(0, frame - wordStartFrame);

          const entranceScale = spring({
            frame: localWordFrame,
            fps,
            from: 0.75,
            to: 1.0,
            config: { damping: 8, stiffness: 220, mass: 0.6 },
          });

          const entranceOpacity = interpolate(
            frame,
            [wordStartFrame, wordStartFrame + WORD_ENTRANCE_FRAMES],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          const wordColor = isEmphasis ? palette.warning : isActive ? palette.accent : palette.text;
          const wordOpacity = isActive || isEmphasis ? 1 : 0.8;
          const emphasisScale = isActive && isEmphasis ? 1.3 : 1.0;
          const glowAlpha = isActive ? (isEmphasis ? "88" : "66") : "00";

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                color: wordColor,
                fontWeight: 700,
                opacity: wordOpacity * entranceOpacity,
                transform: `scale(${entranceScale * emphasisScale})`,
                transformOrigin: "center bottom",
                textShadow: `0 0 32px ${wordColor}${glowAlpha}, 0 0 12px ${wordColor}${isActive ? "55" : "00"}`,
              }}
            >
              {sw.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
