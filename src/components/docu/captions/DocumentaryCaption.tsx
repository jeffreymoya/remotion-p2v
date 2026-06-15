import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { COLORS, FONT, LEADING, SHADOW, SPACING, WEIGHT } from "../common/tokens";
import { zWordTiming } from "../../../lib/pipeline/schemas";

export { zWordTiming };

export const zCaptionSentence = z.object({
  startFrame: z.number(),
  endFrame: z.number(),
  tokenWordIndexes: z.array(z.number()),
  emphasisWordIndexes: z.array(z.number()).optional(),
});

export const documentaryCaptionSchema = z.object({
  wordTimings: z.array(zWordTiming),
  sentences: z.array(zCaptionSentence),
  accent: zColor(),
  textColor: zColor(),
});

export type DocumentaryCaptionProps = z.infer<typeof documentaryCaptionSchema>;

const SENTENCE_FADE = 10;

export const documentaryCaptionDefaults: DocumentaryCaptionProps = {
  wordTimings: [
    { word: "The", startSeconds: 0, endSeconds: 0.2 },
    { word: "money", startSeconds: 0.2, endSeconds: 0.5 },
    { word: "moved", startSeconds: 0.5, endSeconds: 0.8 },
    { word: "before", startSeconds: 0.8, endSeconds: 1.1 },
    { word: "anyone", startSeconds: 1.1, endSeconds: 1.4 },
    { word: "noticed.", startSeconds: 1.4, endSeconds: 1.8 },
  ],
  sentences: [
    {
      startFrame: 0,
      endFrame: 90,
      tokenWordIndexes: [0, 1, 2, 3, 4, 5],
      emphasisWordIndexes: [1, 2],
    },
  ],
  accent: COLORS.blue,
  textColor: "#e2e8f0",
};

import { defineMeta } from "../common/meta";

export const documentaryCaptionMeta = defineMeta({
  tier: "composite",
  category: "caption",
  purpose: "Documentary subtitle/caption for narration.",
  whenToUse: "Render spoken narration/subtitles in documentary style.",
  scriptCues: ["caption", "subtitle", "narration", "voiceover", "says", "spoken", "transcript"],
  composes: [],
  canonicalExample: "src/components/docu/captions/DocumentaryCaption.tsx",
});

/**
 * Word-by-word play-along caption that highlights the active and emphasised
 * words. Ported from `DocumentaryCaption`: palette → accent/text props, `fps`
 * read from `useVideoConfig` instead of a prop.
 */
export const DocumentaryCaption: React.FC<DocumentaryCaptionProps> = (props) => {
  const p = { ...documentaryCaptionDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const current = p.sentences.find((s) => frame >= s.startFrame && frame < s.endFrame);
  if (!current) return null;

  const opacity = interpolate(
    frame,
    [current.startFrame, current.startFrame + SENTENCE_FADE, current.endFrame - SENTENCE_FADE, current.endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const words = current.tokenWordIndexes
    .filter((i) => i < p.wordTimings.length)
    .map((i) => p.wordTimings[i]);

  let activeWordIdx = -1;
  for (let i = 0; i < words.length; i++) {
    if (frame >= words[i].startSeconds * fps) activeWordIdx = i;
  }
  const emphasis = new Set(current.emphasisWordIndexes ?? []);

  return (
    <div
      data-visual-role="caption"
      style={{
        position: "absolute",
        bottom: 60,
        left: SPACING.frameInset * 2,
        right: SPACING.frameInset * 2,
        fontFamily: FONT.body,
        fontSize: 52,
        lineHeight: LEADING.normal,
        textAlign: "left",
        textShadow: SHADOW.text,
        opacity,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3em" }}>
        {words.map((w, i) => {
          const highlighted = i === activeWordIdx || emphasis.has(i);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                color: highlighted ? p.accent : p.textColor,
                fontWeight: highlighted ? WEIGHT.bold : WEIGHT.regular,
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
