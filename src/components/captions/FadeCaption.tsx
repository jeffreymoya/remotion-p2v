import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/CormorantGaramond";
import type { WordCaptionProps } from "./types";

const { fontFamily } = loadFont();

const SLIDE_FRAMES = 18;
const SLIDE_OFFSET_PX = 24;
const MIN_FADE_FRAMES = 30;
const FADE_DURATION_RATIO = 0.7;
const MAX_OPACITY = 0.8;
const CAPTION_COLOR = "#ebe5d9";

export const FadeCaption: React.FC<WordCaptionProps> = ({
  frame,
  fps,
  sentenceWords,
  opacity,
  sentenceText,
}) => {
  if (sentenceWords.length === 0) return null;

  const anchorFrame = Math.floor(sentenceWords[0].startSeconds * fps);
  const lastWordFrame = Math.floor(
    sentenceWords[sentenceWords.length - 1].startSeconds * fps,
  );
  const fadeFrames = Math.max(
    MIN_FADE_FRAMES,
    Math.floor((lastWordFrame - anchorFrame) * FADE_DURATION_RATIO),
  );
  const localFrame = frame - anchorFrame;

  const translateY = interpolate(
    localFrame,
    [0, SLIDE_FRAMES],
    [SLIDE_OFFSET_PX, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const entranceOpacity = interpolate(
    localFrame,
    [0, fadeFrames],
    [0, MAX_OPACITY],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const combinedOpacity = opacity * entranceOpacity;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", paddingBottom: 140, opacity: combinedOpacity }}>
      <div
        style={{
          display: "block",
          padding: "0 120px",
          fontFamily,
          fontSize: 88,
          lineHeight: 1.4,
          textAlign: "left",
          color: CAPTION_COLOR,
          fontWeight: 300,
          transform: `translateY(${translateY}px)`,
          textShadow: "0 2px 10px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.45)",
        }}
      >
        {sentenceText.trim()}
      </div>
    </AbsoluteFill>
  );
};
