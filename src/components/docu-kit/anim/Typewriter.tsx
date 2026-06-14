import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { TextStyle } from "../utils/types";

export interface TypeRun {
  text: string;
  color?: string;
  bold?: boolean;
}

export interface TypeLine {
  runs: TypeRun[];
}

export interface TypewriterProps {
  lines: TypeLine[];
  style: TextStyle;
  startFrame?: number;
  lineDurFrames?: number;
  lineGapFrames?: number;
  cursor?: boolean;
  cursorColor?: string;
  exit?: number;
}

/**
 * Per-line width reveal with a frame-driven blinking cursor. Replaces the
 * `type-line` width keyframe and the CSS `blink` cursor animation.
 */
export const Typewriter: React.FC<TypewriterProps> = ({
  lines,
  style,
  startFrame = 0,
  lineDurFrames = 36,
  lineGapFrames = 48,
  cursor = true,
  cursorColor,
  exit = 0,
}) => {
  const frame = useCurrentFrame();
  const fade = 1 - exit;
  const lastLineStart = startFrame + (lines.length - 1) * lineGapFrames;
  const cursorVisible = frame >= lastLineStart && Math.floor(frame / 15) % 2 === 0;

  return (
    <div style={{ opacity: fade }}>
      {lines.map((line, li) => {
        const start = startFrame + li * lineGapFrames;
        const progress = interpolate(frame, [start, start + lineDurFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const isLast = li === lines.length - 1;
        return (
          <div
            key={li}
            style={{
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              width: `${progress * 100}%`,
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              letterSpacing: style.letterSpacing,
              lineHeight: style.lineHeight,
              color: style.color,
            }}
          >
            {line.runs.map((run, ri) => (
              <span
                key={ri}
                style={{
                  color: run.color ?? style.color,
                  fontWeight: run.bold ? 700 : style.fontWeight,
                }}
              >
                {run.text}
              </span>
            ))}
            {cursor && isLast ? (
              <span
                style={{
                  display: "inline-block",
                  width: style.fontSize * 0.45,
                  height: style.fontSize,
                  background: cursorColor ?? style.color,
                  verticalAlign: -style.fontSize * 0.1,
                  marginLeft: 4,
                  opacity: cursorVisible ? 1 : 0,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
